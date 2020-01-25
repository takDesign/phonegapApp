/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var map;
var marker;
function initMap() {
    // Show where it is now
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log(
                "latitude:" +
                    position.coords.latitude +
                    " longitude:" +
                    position.coords.longitude
            );
            map = new google.maps.Map(document.getElementById("map"), {
                center: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                },
                zoom: 15
            });
            marker = new google.maps.Marker({
                position: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                },
                map: map
            });
        },
        function(error) {
            switch (error.code) {
                case 1: //PERMISSION_DENIED
                    alert("Location Access: PERMISSION_DENIED");
                    break;
                case 2: //POSITION_UNAVAILABLE
                    alert("Location Access: POSITION_UNAVAILABLE");
                    break;
                case 3: //TIMEOUT
                    alert("TIMEOUT");
                    break;
                default:
                    alert("Error Code: " + error.code);
                    break;
            }
        }
    );
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener("deviceready", this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent("deviceready");
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var options = new ContactFindOptions();
        options.filter = ""; // empty search string returns all contacts
        options.multiple = true; // return multiple results
        filter = ["displayName"]; // return contact.displayName field

        // find contacts
        navigator.contacts.find(filter, onSuccess, onError, options);

        // onSuccess: Get a snapshot of the current contacts
        //
        function onSuccess(contacts) {
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].displayName) {
                    // many contacts don't have displayName
                    console.log(contacts[i]);
                    insertRow(contacts[i].displayName, "");
                }
                if (i == 100)
                    // Only load the first 10 contacts
                    break;
            }
            alert("contacts loaded");
        }

        function onError(err) {
            console.log(err);
        }

        function insertRow(field1, field2) {
            let lsContacts = localStorage.getItem("contacts");
            if (lsContacts !== null) {
                lsContacts = JSON.parse(lsContacts);
            } else {
                lsContacts = new Array();
            }

            let newRecord = {
                contactName: field1,
                contactEmail: field2
            };
            lsContacts.push(newRecord);

            localStorage.setItem("contacts", JSON.stringify(lsContacts));
        }

        $(document).on("pagebeforeshow", "#home", function(event) {
            let lsContacts = localStorage.getItem("contacts");
            lsContacts = JSON.parse(lsContacts);
            displayContacts(lsContacts);
        });

        function displayContacts(results) {
            var list = $("#contactListLi");
            list.empty();

            console.log(results);
            var len = results.length,
                i;
            for (i = 0; i < len; i++) {
                list.append(
                    `<li><a href="#editcontact">${results[i].contactName}</li>`
                );
                console.log(results[i].contactName);
            }

            $("#contactListLi").listview("refresh");
        }

        function saveLocation() {} // save current location on localStorage

        document
            .getElementById("save")
            .addEventListener("click", saveLocation());
    }
};

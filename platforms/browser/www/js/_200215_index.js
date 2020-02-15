var map;
var location;
var db;
const dbSize = 5 * 1024 * 1024;

function initMap() {
    navigator.geolocation.getCurrentPosition(getLocation, onError);

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: latitude, lng: longitude },
        zoom: 8
    });
}

function getLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    console.log(latitude, longitude);
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
        // Let's create a database
        db = openDatabase("places", "1", "MyPlaces", dbSize);
        db.transaction(function(tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS " +
                    "PLACES(ID INTEGER PRIMARY KEY ASC, placeName, long, lat)"
            );
        });

        async function insertPlace(name, long = "", lat = "") {
            return new Promise(function(resolve, reject) {
                // save our form to websql
                db.transaction(function(tx) {
                    tx.executeSql(
                        `INSERT INTO places(placeName, long, lat) VALUES (?,?,?)`,
                        [name, long, lat],
                        (tx, res) => {
                            console.log(res);
                            resolve(res);
                        }
                    );
                });
            });
        }

        async function displayPlaces(tx, results) {
            return new Promise((resolve, reject) => {
                var list = $("#listView");
                list.empty();
                console.log(results.rows);
                var len = results.rows.length,
                    i;
                for (i = 0; i < len; i++) {
                    list.append(
                        `<li><a class="editPlace" data-id="${
                            results.rows.item(i).ID
                        }">${results.rows.item(i).placeName} ${
                            results.rows.item(i).lat
                        } ${results.rows.item(i).long}</li>`
                    );
                }
                $("#listView").listview("refresh");
                resolve();
            });
        }
        $("#savePlace").bind("click", async function(event, ui) {
            let currentPlaceName = $("#placeName").val();

            navigator.geolocation.getCurrentPosition(saveRecord, onError);

            function saveRecord(position) {
                insertPlace(
                    currentPlaceName,
                    position.coords.longitude,
                    position.coords.latitude
                );
                console.log(currentPlaceName);
                $("body").pagecontainer("change", "#home");
            }

            function onError(error) {
                alert(
                    "code: " +
                        error.code +
                        "\n" +
                        "message: " +
                        error.message +
                        "\n"
                );
                insertPlace(currentPlaceName, "N/A", "N/A");
                $("body").pagecontainer("change", "#home");
            }
        });

        function onGeoSuccess(position) {
            let coords = {
                lat: position.coords.latitude,
                long: position.coords.longitude
            };
            localStorage.setItem("currentPosition", JSON.stringify(coords));
            console.log(coords);

            var myLatLng = { lat: coords.lat, lng: coords.long };

            var map = new google.maps.Map(document.getElementById("map"), {
                zoom: 20,
                center: myLatLng
            });

            new google.maps.Marker({
                position: myLatLng,
                map: map,
                title: "My Location"
            });
        }

        function onGeoError(error) {
            alert(
                "code: " +
                    error.code +
                    "\n" +
                    "message: " +
                    error.message +
                    "\n"
            );
        }

        $(document).on("pagebeforeshow", "#addplace", function(event) {
            // navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
        });

        $(document).on("pagebeforeshow", "#home", function(event) {
            db.transaction(function(tx) {
                tx.executeSql(`SELECT * FROM places`, [], (tx, res) => {
                    displayPlaces(tx, res);
                });
            });
        });
    }
};

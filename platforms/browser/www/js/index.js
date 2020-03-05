var map;
var db;
const dbSize = 5 * 1024 * 1024;
var baseUrl = 'http://vanapi.gitsql.net';

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 64.128288, lng: -21.827774 },
        // iceland = 64.128288, -21.827774.
        zoom: 8
    });
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
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        // Let's create a database
        db = openDatabase('places', '1', 'MyPlaces', dbSize);
        db.transaction(function(tx) {
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS ' +
                    'PLACES(ID INTEGER PRIMARY KEY ASC, placeName, long, lat)'
            );
        });

        async function insertPlace(name, long = '', lat = '') {
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

        async function deleteLocalStorageRecords() {
            // update Local Storage with the record from cloud DB
            // This will delete all the record in the table and will overwrite with the data from cloud db
            return new Promise(function(resolve, reject) {
                db.transaction(function(tx) {
                    tx.executeSql(`DELETE from places`, [], (tx, res) => {
                        console.log('deleteLocalStorageRecords done');
                        console.log(res);
                        resolve(res);
                    });
                });
            });
        }

        // WIP
        async function updateLocalStorageRecords(records) {
            // update Local Storage with the record from cloud DB
            // This will delete all the record in the table and will overwrite with the data from cloud db
            records.map(function(record) {
                return new Promise(function(resolve, reject) {
                    db.transaction(function(tx) {
                        tx.executeSql(
                            `INSERT INTO places(placeName, long, lat) VALUES (?,?,?)`,
                            [
                                record.placeName,
                                record.longitude,
                                record.latitude
                            ],
                            (tx, res) => {
                                console.log(res);
                                resolve(res);
                            }
                        );
                    });
                });
            });
        }

        async function displayPlaces(tx = '', results) {
            return new Promise((resolve, reject) => {
                var list = $('#listView');
                list.empty();
                console.log(results.rows);
                var len = results.rows.length,
                    i;
                for (i = 0; i < len; i++) {
                    list.append(`<li><a class="navigateTo editPlace" data-id="${
                        results.rows.item(i).ID
                    }" long="${results.rows.item(i).long}"
              lat="${results.rows.item(i).lat}"
              name="${results.rows.item(i).placeName}">${
                        results.rows.item(i).placeName
                    }</li>`);
                }
                $('#listView').listview('refresh');
                $('.navigateTo').bind('tap', function(e, ui) {
                    launchDirections(e);
                });
                resolve();
            });
        }
        // Bind functions
        $('#savePlace').bind('tap', function(event, ui) {
            saveMyPlace();
        });
        $('#loginButton').bind('tap', function(event, ui) {
            performLogin();
        });
        $('#launchCamera').bind('tap', function(event, ui) {
            takeSelfie();
        });

        function launchDirections(e) {
            directions.navigateTo(
                e.target.getAttribute('lat'),
                e.target.getAttribute('long')
            );
        }

        function takeSelfie() {
            navigator.camera.getPicture(onSuccess, onFail, {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI,
                cameraDirection: Camera.Direction.FRONT
            });

            function onSuccess(imageURI) {
                var image = document.getElementById('selfie');
                image.src = imageURI;
            }

            function onFail(message) {
                alert('Failed because: ' + message);
            }
        }

        function saveMyPlace() {
            let currentPlaceName = $('#placeName').val();

            navigator.geolocation.getCurrentPosition(saveRecord, onError);

            function saveRecord(position) {
                insertPlace(
                    currentPlaceName,
                    position.coords.longitude,
                    position.coords.latitude
                );
                console.log(currentPlaceName);
                postRecord(
                    currentPlaceName,
                    position.coords.longitude,
                    position.coords.latitude
                );

                $('body').pagecontainer('change', '#home');
            }

            async function onError(error) {
                alert(
                    'code: ' +
                        error.code +
                        '\n' +
                        'message: ' +
                        error.message +
                        '\n'
                );
                await insertPlace(currentPlaceName, 'N/A', 'N/A');
                $('body').pagecontainer('change', '#home');
            }
        }

        function performLogin() {
            data = {
                username: $('#username').val(),
                password: $('#password').val()
            };

            $.ajax({
                type: 'POST',
                url: `${baseUrl}/auth`,
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success: function(response) {
                    console.log(response);
                    localStorage.setItem('token', response.token);
                    initialSync();
                    $('body').pagecontainer('change', '#home');
                },
                error: function(e) {
                    alert('Error: ' + e.message);
                }
            });
        }

        function initialSync() {
            var records;

            $.ajax({
                type: 'GET',
                url: `${baseUrl}/places`,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader(
                        'authtoken',
                        localStorage.getItem('token')
                    );
                },
                success: function(response) {
                    console.log(response);
                    console.log('Initial sync done');
                    records = response;
                    // db.transaction(function(tx) {
                    //     tx.executeSql(`SELECT * FROM places`, [], (tx, res) => {
                    //         displayPlaces(tx, res);
                    //     });
                    // });
                },
                error: function(e) {
                    alert('Error: ' + e.message);
                }
            })
                .done(function() {
                    deleteLocalStorageRecords();
                })
                .done(function() {
                    updateLocalStorageRecords(records);
                })
                .done(function() {
                    db.transaction(function(tx) {
                        tx.executeSql(`SELECT * FROM places`, [], (tx, res) => {
                            displayPlaces(tx, res);
                        });
                    });
                });
        }

        function postRecord(name, lon, lat) {
            // below sample data for testing
            data = {
                placeName: name,
                longitude: lon,
                latitude: lat
            };
            $.ajax({
                type: 'POST',
                url: `${baseUrl}/places`,
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader(
                        'authtoken',
                        localStorage.getItem('token')
                    );
                },
                success: function(response) {
                    console.log(response);
                    console.log('PostRecord done');
                },
                error: function(e) {
                    alert('Error: ' + e.message);
                }
            });
        }

        function onGeoSuccess(position) {
            let coords = {
                lat: position.coords.latitude,
                long: position.coords.longitude
            };
            localStorage.setItem('currentPosition', JSON.stringify(coords));
            console.log(coords);

            var myLatLng = { lat: coords.lat, lng: coords.long };

            var map = new google.maps.Map(document.getElementById('map'), {
                zoom: 20,
                center: myLatLng
            });

            new google.maps.Marker({
                position: myLatLng,
                map: map,
                title: 'My Location'
            });
        }

        function onGeoError(error) {
            alert(
                'code: ' +
                    error.code +
                    '\n' +
                    'message: ' +
                    error.message +
                    '\n'
            );
        }

        $(document).on('pagebeforeshow', '#addplace', function(event) {
            navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
        });

        $(document).on('pagebeforeshow', '#home', function(event) {
            db.transaction(function(tx) {
                tx.executeSql(`SELECT * FROM places`, [], (tx, res) => {
                    displayPlaces(tx, res);
                });
            });
        });
    }
};

/*
	ontruimingstijdenvergelijkingstool - vergelijk ontruimingstijden
    Copyright (C) 2022 Gemeente Den Haag, Netherlands
    Developed by Jasper Vries
 
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

var active_type = null;
var firstrun = true;

/*
* enable/disable firstrun
*/
function setFirstRun(state = true) {
    $('#menu-new').button('option', 'disabled', state);
    $('#menu-import-new').button('option', 'disabled', state);
    $('#menu-saveas').button('option', 'disabled', state);
    firstrun = state;
}

/*
* select file from disk
*/
document.getElementById('file').addEventListener('change', openFileHandler, false);

function openFileHandler(event) {
    setLoadingScreen('Bestand openen...');
    setTimeout(function() { open_file(event); }, 1);
    setTimeout(function() { setLoadingScreen(null); }, 2);
}

function open_file(event) {
    var file = event.target.files[0];
    if (!file) {
        return;
    }
    var filereader = new FileReader();
    filereader.onload = function(event) {
        var contents = event.target.result;
        document.getElementById('input').value = contents;
    };
    filereader.readAsText(file);
}

/*
* provide download dialog
*/
function download_file(content, filename = null, mimetype = 'text/plain') {
    if (filename == null) {
        filename = 'download.txt';
    }
    var a = document.createElement('a');
    var blob = new Blob([content], {type: mimetype});
    var url = URL.createObjectURL(blob);
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
    a.remove();
 }

 /*
 * escape string to be include in csv
 */
function escapeCsvString(str) {
    str = str.replaceAll('"', '""');
    return str;
}


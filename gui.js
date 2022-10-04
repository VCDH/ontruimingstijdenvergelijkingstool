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

/*
* document ready
*/
$(function() {
    /*
    * init dialogs
    */
    $('#fileinputdialog').dialog({
        autoOpen: false,
        buttons: [
            {
                text: "OK",
                click: function() {
                    loadFileContentsHandle(active_type);
                    $(this).dialog('close');
                }
            },
            {
                text: "Annuleren",
                click: function() {
                    active_type = null;
                    document.getElementById('input').value = '';
                    $(this).dialog('close');
                }
            }
        ],
        modal: true,
        width: 800
    });
    $('#helpdialog').dialog({
        autoOpen: false,
        buttons: [
            {
                text: "Sluiten",
                click: function() {
                    $(this).dialog('close');
                }
            }
        ],
        title: 'Help',
        width: Math.min(800, window.innerWidth),
        maxHeight: window.innerHeight,
        open: function() {
            $('.ui-dialog-content').scrollTop(0); //fix dialog scrolling down
        }
    });
    /*
    * init buttons
    */
    $('#menu-new').button();
    $('#menu-open').button();
    $('#menu-import-old').button();
    $('#menu-import-new').button();
    $('#menu-saveas').button();
    $('#menu-export').button();
    $('#menu-help').button();
    $('#menu-hide-specialk').checkboxradio();
    $('#menu-hide-zerodiff').checkboxradio();
    $('#menu-hide-smalldiff').checkboxradio();
    setFirstRun();
    /*
    * button onclick handles
    */
    $('#menu-new').click(function() {
        let prompt = confirm('Alle ingeladen informatie en toegevoegde opmerkingen worden gewist. Doorgaan?');
        if (prompt == true) {
            clearBackup();
            newButtonClickHandle();
            setFirstRun();
        }
    });
    $('#menu-open').click(function() {
        openImportDialog('open');
    });
    $('#menu-import-old').click(function() {
        openImportDialog('old');
    });
    $('#menu-import-new').click(function() {
        openImportDialog('new');
    });
    $('#menu-saveas').click(function() {
        saveAsButtonClickHandle();
    });
    $('#menu-export').click(function() {
        exportButtonClickHandle();
    });
    $('#menu-help').click(function() {
        openHelpDialog();
    });
    $('#menu-hide-specialk').click(function() {
        showhideRows();
    });
    $('#menu-hide-zerodiff').click(function() {
        //also uncheck smalldiff if zerodiff is unchecked
        if ($('#menu-hide-zerodiff').prop('checked') == false) {
            $('#menu-hide-smalldiff').prop('checked', false).button('refresh');
        }
        showhideRows();
    });
    $('#menu-hide-smalldiff').click(function() {
        //also check zerodiff if smalldiff is checked
        if ($('#menu-hide-smalldiff').prop('checked') == true) {
            $('#menu-hide-zerodiff').prop('checked', true).button('refresh');
        }
        showhideRows();
    });
    /*
    * meta onchange handlers
    */
    $('#meta').on('change', 'input', function() {
        saveMetaToTable();
    });
    //hide loading screen
    setLoadingScreen(null);
});

/*
* handle import dialog
*/
function openImportDialog(type) {
    document.getElementById('input').value = '';
    active_type = type;
    var title;
    if (type == 'open') {
        title = 'Open opgeslagen json bestand';
    }
    else if (type == 'old') {
        title = 'Importeer huidig pdump bestand';
    }
    else if (type == 'new') {
        title = 'Importeer nieuw ccol bestand';
    }
    $('#fileinputdialog').dialog('option', 'title', title);
    $('#fileinputdialog').dialog('open');
}

 /*
 * loading screen
 */
function setLoadingScreen(text = null) {
    //hide loading screen
    if (text == null) {
        $('#loadingscreencontainer').hide();
    }
    else {
        $('#loadingscreencontainer').show();
        $('#loadingscreencontainer span').text(text);
    }
    //console.log('loading screen ' + text);
}

/*
* help dialog
*/
function openHelpDialog()  {
    $('#helpdialog').dialog('open');
}

/*
* prevent accidental closing of page
*/
window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});

/* 
* button handlers
*/
function loadFileContentsHandle(variant) {
    var file = document.getElementById('input').value;
    if (variant == 'open') {
        setLoadingScreen('Bestand openen...');
        setTimeout(function() { 
            var res = loadSavedFile(file); 
            if (!res) {
                alert('Kan bestand niet openen. Ongeldig bestandsformaat.');
            }
            setTimeout(function() { setLoadingScreen(null); }, 300)
        }, 1);
        
    }
    else if ((variant == 'old') || (variant == 'new')) {
        setLoadingScreen('Gegevens inlezen...');
        setTimeout(function() { read_file(variant, file); }, 3);
        setTimeout(function() { setLoadingScreen(null); }, 4);
    }
    setFirstRun(false);
}

function saveAsButtonClickHandle() {
    let filename = ((typeof table.m.intersection !== 'undefined') ? table.m.intersection : '') + '_ontruimingstijdenvergelijking_' + getCurrentYyyymmdd() + '.json';
    download_file(JSON.stringify(table), filename);
    clearBackup();
}

function exportButtonClickHandle() {
    let csv = exportToCsv();
    let filename = ((typeof table.m.intersection !== 'undefined') ? table.m.intersection : '') + '_ontruimingstijdenvergelijking_' + getCurrentYyyymmdd() + '.csv';
    download_file(csv, filename, 'text/csv')
}

function newButtonClickHandle() {
    //clear table
    newTable();
    $('#outputtable tbody').html('');
}

function getCurrentYyyymmdd(separator='') {
    let date = new Date();
    return String(date.getFullYear()) + separator + String(date.getMonth()+1).padStart(2, '0') + separator + '' + String(date.getDate()).padStart(2, '0');
}

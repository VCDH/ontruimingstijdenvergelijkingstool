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

var table;
function newTable() {
    table = {t: [], m:{}};
    //leeg meta velden
    $('#meta_intersection').val('');
    $('#meta_creator').val('');
    $('#meta_reviewer').val('');
    $('#meta_date_create').val('');
    $('#meta_date_review').val('');
    $('#meta_old_type').html('');
    $('#meta_old_source').html('');
    $('#meta_new_type').html('');
    $('#meta_new_source').html('');
}
newTable();

function read_file(variant, file) { 
    //zoek type pdump/ccol op basis van bestandsinhoud
    let filetype;
    let filetype_named;
    let type;
    let regex = [
        /(TO|TIG) ([0-9]+) ([0-9]+): (-?\d+)(\/te)?\s?/,
        /(TOR|TIG)_max\[fc([0-9]+)\]\[fc([0-9]+)\]\s*=\s*(-?\d+);/
    ];
    //TO 01 37: -3              TO 01 38: 30/te           TO 02 05: 10/te
        //example result:
        //0: "TO 01 38: 30/te\n"
        //1: "TO"
        //​2: "01"
        //​3: "38"
        //​​4: "30"
        //5: "/te"
    //TIG_max[fc01][fc38]= 91;
        //example result:
        //0: "TIG_max[fc01][fc38]= 91;"
        //​1: "TIG"
        //​2: "01"
        //​​3: "38"
        //4: "91"
    regex.forEach((matchstr, index) => {
        let match;
        if (match =file.match(matchstr)) {
            switch (index) {
                case 0:
                    filetype_named = 'pdump';
                    break;
                case 1:
                    filetype_named = 'ccol';
                    break;
            }
            filetype = index;
            type = match[1];
        }
    });
    //waarschuwing bij inlezen tab.c voor oude waarden
    if ((filetype == 1) && (variant == 'old')) {
        alert('Je hebt mogelijk een tab.c ingelezen in plaats van een pdump. Lees een pdump in of controleer of de waarden overeen komen met de huidige waarden op straat!');
    }
    //zet type en filetype in meta
    if (typeof table.m[variant] === 'undefined') {
        table.m[variant] = {};
    }
    table.m[variant].type = type;
    table.m[variant].source = filetype_named;
    //als TIG, parseer bestand voor geeltijden
    if (type == 'TIG') {
        if (typeof table.g === 'undefined') {
            table.g = [];
        }
        let tglregex = [
            /TGL ([0-9]+): (\d+)\/te/,
            /TGL_max\[fc([0-9]+)\]\s*=\s*(\d+);/
        ];
        //TGL 01: 30/te
        //TGL_max[fc01]= 30;
        //1: 01
        //2: 30
        //parseer bestand voor geeltijden
        let matches = file.matchAll(new RegExp(tglregex[filetype], 'g'));
        matches = Array.from(matches);
        //lees naar tabel
        matches.forEach((item) => {
            //kijk of rij al in tabel is en werk bij
            let rowupdated = false;
            for (let row of table.g) {
                if ((row.fc == item[1])) {
                    //werk array bij
                    row[variant] = item[2];
                    //voorkom dubbele vermelding
                    rowupdated = true;
                    break;
                }
            };
            //voeg nieuwe rij toe
            if (rowupdated == false) {
                //voeg toe aan array
                table.g.push({
                    //id: table.g.length,
                    fc: item[1],
                    [variant]: item[2]
                });
            }
        });
    }

    //parseer bestand voor ontruimingstijden
    let matches = file.matchAll(new RegExp(regex[filetype], 'g'));
    matches = Array.from(matches);

    //lees naar tabel
    matches.forEach((item) => {
        //kijk of rij al in tabel is en werk bij
        let rowupdated = false;
        for (let row of table.t) {
            if ((row.fca == item[2])
            && (row.fcb == item[3])) {
                //werk array bij
                row[variant] = item[4];
                //bereken verschil
                let diff = null;
                if ((typeof row.old !== 'undefined') && (typeof row.new !== 'undefined') && (row.old >= 0) && (row.new >= 0)) {
                    //bereken verschil
                    diff = row.new - row.old;
                    //trek geeltijden af voor intergroen
                    let tgl = 0;
                    for (let r of table.g) {
                        if ((r.fc == row.fca)) {
                            //oude waarde
                            if ((typeof table.m.old.type !== 'undefined') && (table.m.old.type == 'TIG')) {
                                tgl = tgl + r.old;
                            }
                            //nieuwe waarde
                            if ((typeof table.m.new.type !== 'undefined') && (table.m.new.type == 'TIG')) {
                                tgl = tgl + r.new;
                            }
                            break;
                        }
                    };
                    row.diff = diff - tgl;
                }
                else if (typeof row.diff !== 'undefined') {
                    //verwijder verschil
                    delete row.diff;
                }
                //voorkom dubbele vermelding
                rowupdated = true;
                break;
            }
        };
        //voeg nieuwe rij toe
        if (rowupdated == false) {
            //voeg toe aan array
            table.t.push({
                //id: table.t.length,
                fca: item[2],
                fcb: item[3],
                [variant]: item[4]
            });
            //bij een nieuwe rij kunnen er nooit zowel een oude als nieuwe waarde zijn, dus hoeft geen verschil berekend te worden
        }
        type = item[1];
    });
    //zet metadata
    if (matches.length > 0) {
        if (typeof table.m[variant] === 'undefined') {
            table.m[variant] = {};
        }
        if (typeof table.m[variant].type === 'undefined') {
            table.m[variant].type = '';
        }
        table.m[variant].type = type;
    }
    toHtmlTable();
    updateMetaDisplay();
}

/*
* schrijf html tabel
*/
function toHtmlTable() {
    //maak tabel leeg
    $('#outputtable tbody').html('');
    //schrijf rijen
    for (let row of table.t) {
        //bepaal kleur klasse voor verschil
        let tdclass = null;
        if (typeof row.diff !== 'undefined') {
            if (Math.abs(row.diff) >= 20) {
                tdclass = 'diff-20';
            }
            else if (Math.abs(row.diff) >= 10) {
                tdclass = 'diff-10';
            }
        }
        //schrijf rij
        $('#outputtable tbody').append('<tr><td>' + ((typeof row.fca !== 'undefined') ? row.fca : '') + '</td><td>' + ((typeof row.fcb !== 'undefined') ? row.fcb : '') + '</td><td>' + ((typeof row.old !== 'undefined') ? row.old : '') + '</td><td>' + ((typeof row.new !== 'undefined') ? row.new : '') + '</td><td' + ((tdclass !== null) ? ' class="' + tdclass + '"' : '') + '>' + ((typeof row.diff !== 'undefined') ? row.diff : '') + '</td><td>' + ((typeof row.comment_creator !== 'undefined') ? row.comment_creator : '') + '</td><td>' + ((typeof row.comment_reviewer !== 'undefined') ? row.comment_reviewer : '') + '</td></tr>');
        showhideSpecialKRows();
    };
}

/*
* verberg NK/FK/GK/GKL conflicten
*/
function showhideSpecialKRows() {
    let val = $('#menu-hide-specialk').prop('checked');
    //rows must be hidden
    if (val == true) {
        $('#outputtable tbody > tr').each(function(index, tr) {
            //get values
            let oldval = $('#outputtable tbody tr:eq(' + (index) + ') td:eq(2)').html();
            let newval = $('#outputtable tbody tr:eq(' + (index) + ') td:eq(3)').html();
            
            //check if there is a specific value combination and hide it
            if (((oldval == '') || (oldval == '-1') || (oldval == '-2') || (oldval == '-3') || (oldval == '-4')) && ((newval == '') || (newval == '-1') || (newval == '-2') || (newval == '-3') || (newval == '-4'))) {
                $('#outputtable tbody tr:eq(' + (index) + ')').hide();
            }
        });
    }
    //rows must be shown
    else {
        $('#outputtable tbody tr').show();
    }
}

/*
* update sectie algemene gegevens
*/
function updateMetaDisplay() {
    if (typeof table.m.old !== 'undefined') {
        if (typeof table.m.old.type !== 'undefined') {
            $('#meta_old_type').html(table.m.old.type);
        }
        if (typeof table.m.old.source !== 'undefined') {
            $('#meta_old_source').html(table.m.old.source);
        }
    }
    if (typeof table.m.new !== 'undefined') {
        if (typeof table.m.new.type !== 'undefined') {
            $('#meta_new_type').html(table.m.new.type);
        }
        if (typeof table.m.new.source !== 'undefined') {
            $('#meta_new_source').html(table.m.new.source);
        }
    }
}
/*
* zet algemene gegevens in tabel
*/
function saveMetaToTable() {
    table.m.intersection = $('#meta_intersection').val();
    table.m.creator = $('#meta_creator').val();
    table.m.reviewer = $('#meta_reviewer').val();
    table.m.date_create = $('#meta_date_create').val();
    table.m.date_review = $('#meta_date_review').val();
}

/*
* document ready
*/
$(function() {
    /*
    * editable comment field
    */
    function editableCommentField(e) {
        //check if there is an input and if not add it
        if (!$(e.target).children('input').length) {
            //add input
            $(e.target).html('<input type="text" value="' + $(e.target).text() + '">');
            $('#outputtable tbody').on('blur', 'input', function(e) {
                //for some reason this is called twice
                if ($(e.target).parents('tr').index() >= 0) {
                    //decide column
                    let col;
                    switch ($(e.target).parents('td').index()) {
                        case 5:
                            col = 'comment_creator';
                            break;
                        case 6:
                            col = 'comment_reviewer';
                            break;
                    }
                    //update table
                    if ($(e.target).val().length > 0) {
                        //insert new value
                        table.t[($(e.target).parents('tr').index())][col] = $(e.target).val();
                    }
                    else {
                        //remove property from object if empty, as to not have empty values in the output
                        delete table.t[($(e.target).parents('tr').index())][col];
                    }
                    //remove input
                    $(e.target).parent().text($(e.target).val());
                }
            });
        }
        //set focus
        $(e.target).children('input').focus();
    }
    $('#outputtable tbody').on('click', 'td:nth-child(n+6)', editableCommentField);
});

 /*
 * load saved file
 */
 function loadSavedFile (json) {
    //clear table
    newButtonClickHandle();
    //import
    try {
        let res = JSON.parse(json);
        //TOR/TIG
        res.t.forEach((item) => {
            //append array
            table.t.push({
                fca: item.fca,
                fcb: item.fcb,
                ...(typeof item.old !== 'undefined') && {old: item.old},
                ...(typeof item.new !== 'undefined') && {new: item.new},
                ...(typeof item.diff !== 'undefined') && {diff: item.diff},
                ...(typeof item.comment_creator !== 'undefined') && {comment_creator: item.comment_creator},
                ...(typeof item.comment_reviewer !== 'undefined') && {comment_reviewer: item.comment_reviewer}
            });
        });
        //TGL
        if (typeof res.g !== 'undefined') {
            table.g = [];
            res.g.forEach((item) => {
                //append array
                table.g.push({
                    fc: item.fc,
                    ...(typeof item.old !== 'undefined') && {old: item.old},
                    ...(typeof item.new !== 'undefined') && {new: item.new}
                });
            });
        }
        //META
        table.m = res.m;
        //display contents
        if (typeof table.m.intersection !== 'undefined') {
            $('#meta_intersection').val(table.m.intersection);
        }
        if (typeof table.m.creator !== 'undefined') {
            $('#meta_creator').val(table.m.creator);
        }
        if (typeof table.m.reviewer !== 'undefined') {
            $('#meta_reviewer').val(table.m.reviewer);
        }
        if (typeof table.m.date_create !== 'undefined') {
            $('#meta_date_create').val(table.m.date_create);
        }
        if (typeof table.m.date_review !== 'undefined') {
            $('#meta_date_review').val(table.m.date_review);
        }
        toHtmlTable();
        updateMetaDisplay();
    } 
    catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

 /*
 * export naar csv
 */
function exportToCsv() {
    //verwerk table naar csv
    let csv = '';
    let eol = "\r\n";
    csv += 'Kruispunt;' + ((typeof table.m.intersection !== 'undefined') ? table.m.intersection : '') + eol;
    csv += 'Opsteller;' + ((typeof table.m.creator !== 'undefined') ? table.m.creator : '') + eol;
    csv += 'Datum;' + ((typeof table.m.date_create !== 'undefined') ? table.m.date_create : '') + eol;
    csv += 'Controleur;' + ((typeof table.m.reviewer !== 'undefined') ? table.m.reviewer : '') + eol;
    csv += 'Datum;' + ((typeof table.m.date_review !== 'undefined') ? table.m.date_review : '') + eol;
    csv += 'Type huidig;' + ((typeof table.m.old.type !== 'undefined') ? table.m.old.type : '') + eol;
    csv += 'Bron huidig;' + ((typeof table.m.old.source !== 'undefined') ? table.m.old.source : '') + eol;
    csv += 'Type nieuw;' + ((typeof table.m.new.type !== 'undefined') ? table.m.new.type : '') + eol;
    csv += 'Bron nieuw;' + ((typeof table.m.new.source !== 'undefined') ? table.m.new.source : '') + eol;
    csv += '' + eol;
    csv += 'FC van;FC naar;Huidige waarde;Nieuwe waarde;Verschil;Opmerking opsteller;Opmerking controleur' + eol;
    for (let row of table.t) {
        //schrijf rij
        csv += ((typeof row.fca !== 'undefined') ? row.fca : '') + ';' + ((typeof row.fcb !== 'undefined') ? row.fcb : '') + ';' + ((typeof row.old !== 'undefined') ? row.old : '') + ';' + ((typeof row.new !== 'undefined') ? row.new : '') + ';' + ((typeof row.diff !== 'undefined') ? row.diff : '') + ';' + ((typeof row.comment_creator !== 'undefined') ? '"' + escapeCsvString(row.comment_creator) + '"' : '') + ';' + ((typeof row.comment_reviewer !== 'undefined') ? '"' + escapeCsvString(row.comment_reviewer) + '"' : '') + eol;
    };
    //geeltijden
    if (typeof table.g !== 'undefined') {
        csv += '' + eol;
        csv += 'Geeltijden' + eol;
        csv += 'FC;Oude waarde;Nieuwe waarde' + eol;
        for (let row of table.g) {
            //schrijf rij
            csv += ((typeof row.fc !== 'undefined') ? row.fc : '') + ';' + ((typeof row.old !== 'undefined') ? row.old : '') + ';' + ((typeof row.new !== 'undefined') ? row.new : '') + eol;
        };
    }
    return csv;
}
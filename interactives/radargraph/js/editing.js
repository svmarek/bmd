$(document).ready(function () {

    $(document).foundation({
        reveal: {
            animation: 'fade'
        }
    });

})

// Define vars
var dataTheshold;
var length;
var feedbackJSON;
var DATA;
var counter;
var radarTitle;
var radarIntro;
var labels;


//test out making this re-usable. Use URL parameters to name the json file we're looking for.
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};

var choice = getUrlParameter('d');



// read in data, populate the page(s) from a .JSON file (or equivalent)
var json = $.getJSON("./data/" + choice + ".json", function (data) {
    DATA = data;
    dataThreshold = data[0].threshold;
    length = data[0].pages.length;
    labels = data[0].labels;
    radarTitle = data[0].title;
    radarIntro = data[0].introduction;
    feedbackJSON = data[0].feedback;

    $('#intro').append("<label>Title</label><h1><input type='text' id='title' value='" + radarTitle + "'/></h1>");
    $('#intro').append("<labelIntroductory text</label><textarea id='introText'>" + radarIntro + "</textarea>");
    $('#intro').append("<label>Threshold - average scores <strong>under</strong> this value will cause feedback to be shown for the page or category</label><input id='thresh' type='number' value='" + dataThreshold + "'style='width: fit-content'/>");

    // adjust labels
    $('#intro').append("<label>Label choices</label>");



    for (var l = 0; l < labels.length; l++) {
        $('#intro').append("<input id='labels" + l + "' type='text' value='" + labels[l] + "' style='width: fit-content;display: inline-block; margin-right: 1em;'/>")
    }


    for (var i = 0; i < data[0].pages.length; i++) {
        var id = data[0].pages[i].name.toLowerCase();
        id = id.replace(/\s/g, '');

        let ident = i + 1;

        $('#paging').append("<h3>" + "Page " + ident +  "</h3>");

        let pageDiv = "<div id='page" + ident + "'></div>";

        let entryVal = "<label>" + "Page Title" + "</label>" + "<h4><input class='page-name' id='" + id + "-name' type='text' value='" + data[0].pages[i].name + "'/></h4>" +
            "<label>Description text</label><p><input class='page-description' id'" + id + "-description' type='text' value='" + data[0].pages[i].description + "'/></p>";

        $('#paging').append(pageDiv);
        $('#page' + ident).append(entryVal);

        // feedback
        $('#page' + ident).append("<h4>Feedback</h4><p>The following feedback will be shown for category scores which are less than the <strong>threshold</strong> indicated above.</p>");

        let feedbackArea = "<textarea class='feedback' id='" + id + "-feedback'>" + data[0].feedback[i].text + "</textarea>";

        $('#page' + ident).append(feedbackArea);


        //loop through questions now
        $('#page' + ident).append("<h4>Statements</h4>");

        for (var j = 0; j < data[0].pages[i].statements.length; j++) {
            let pageAnswers = "<input class='statement' type='text' id='" + id + "-statement" + j + "' value='" + data[0].pages[i].statements[j] + "'/>";
            $('#page' + ident).append(pageAnswers);
        }

        


        $('#paging').append("<p class='butts' id='" + id + "butt'></p>");
        $('#' + id + 'butt').append("<button class='button small secondary' onclick='addStatement(" + id + ", " + ident + ")'>Add statement</button>")
    }
    counter = i;

    $('#controls').append("<button class='button small primary' onclick='addItem(" + counter + ")'>Add page</button>")

});

function saveChanges() {
    var newData = [{}];

    // get the basics down first

    dataThreshold = parseInt($('#thresh').val());
    radarTitle = $('#title').val();
    radarIntro = $('#introText').val();
    radarLabels = [];
    
    // get new label data
    for (var l = 0; l < labels.length; l++) {
        radarLabels[l] = $('#labels'+l).val();
    }

    //build out the newData element
    newData = [{
        "title": radarTitle,
        "introduction": radarIntro,
        "labels": radarLabels,
        "threshold": dataThreshold,
        "pages": [],
        "feedback": []
    }]

    // run through all of the inputs, start to build out the new JSON. Compare with DATA.

    var tempPages = []
    $('#paging').children('div').each(function (index, item) {
       var newPage = {
           "name": '',
           "description": '',
           "statements": []
       };

        

        var title = $(item).find('.page-name').val();
        var descript = $(item).find('.page-description').val();

        newPage.name = title;
        newPage.description = descript;

        var statements = $(item).find('.statement');
        for (var i = 0; i < statements.length; i++) {
            let state = statements[i];




            newPage.statements.push(state.value);
        }
        newData[0].pages.push(newPage);

        var feedbackk = $(item).find('.feedback').val();

        var newFeedback = {"name": title, "text": feedbackk};
        newData[0].feedback.push(newFeedback);

    });
    console.log(newData[0]);




    //downloadObjectAsJson(newData, 'newFile');

    $("#instructions").html("With the file just downloaded - <strong>newFile.json</strong>, upload this to GitHub [more instructions here], rename it to what you like and your radargraph will now be visible at: <br> URL/radargraph/index.html?d=newFile <br><br> To create a new version of this to re-upload, head to: <br> URL/radargraph/edit.html?d=newFile");

}


function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

function addItem(length) {
    counter++;
    $('#paging').append("<h3>Page " + counter + "</h3>");
    let pageDiv = "<div id='page" + counter + "'></div>";

    let entryVal = "<label>" + "Page Title" + "</label>" + "<h4><input type='text' class='page-name' value='Page " + counter + "'/></h4>" +
        "<label>Description text</label><p><input class='page-description' type='text' value='Page Description'/></p>";

    $('#paging').append(pageDiv);
    $('#page' + counter).append(entryVal);

    // feedback
    $('#page' + counter).append("<h4>Feedback</h4><p>The following feedback will be shown for category scores which are less than the <strong>threshold</strong> indicated above.</p>");

    let feedbackArea = "<textarea class='feedback'>" + "" + "</textarea>";

    $('#page' + counter).append(feedbackArea);
    //loop through questions now
    $('#page' + counter).append("<h4>Statements</h4>");

    let pageAnswers = "<input class='statement' type='text' value=''/>";
    $('#page' + counter).append(pageAnswers);


    

    $('#paging').append("<p class='butts' id='" + counter + "butt'></p>");
    $('#' + counter + 'butt').append("<button class='button small secondary' onclick='addStatement(page" + counter + ", " + counter + ", null)'>Add statement</button>");

}

function addStatement(section, pageNum, stateNum) {
    let adding = '#page' + pageNum;
    $(adding).append("<input class='statement' type='text' id='" + section.id + "-statement' value=''/>")
}
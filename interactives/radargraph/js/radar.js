$(document).ready(function () {

    $(document).foundation({
        reveal: {
            animation: 'fade'
        }
    });

    var role;
    //save the role
    $("#role").change(function () {
        role = $(this).val();
        console.log(role);
    })



    // Define vars
    var dataTheshold;
    var length;
    var feedbackJSON;


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


    // variable for saving what the final page is - used to trigger unique functions on the last page click
    var finalPage;

    // read in data, populate the page(s) from a .JSON file (or equivalent)
    var json = $.getJSON("./data/" + choice + ".json", function (data) {
        dataThreshold = data[0].threshold;
        length = data[0].pages.length;
        var labels = data[0].labels;
        var title = data[0].title;
        var intro = data[0].introduction;
        feedbackJSON = data[0].feedback;

          // change page title to match the title from the data
        document.title = "Radargraph: " + title; 

        $('#intro').append("<h1>" + title + "</h1>");
        $('#intro').append("<p>" + intro + "</p>");
        //look for entry that dictates if the activity should have a name entry
        //if so, append it after the intro

        for (var i = 0; i < data[0].pages.length; i++) {
            var id = data[0].pages[i].name.toLowerCase();
            id = id.replace(/\s/g, '');

            //open div
            if (i == 0) {
                $('#chart').before(
                    "<div id='" + id + "' class = 'page panel active'>"


                );
            } else {
                $('#chart').before(
                    "<div id='" + id + "' class = 'page panel'>"
                );
            }


            $('#' + id).append("<h2>" + data[0].pages[i].name + "</h2><p>" + data[0].pages[i].description + "</p>" + "<ol class='questions' id='" + id + "-qs'></ol>");

            //loop through questions now

            for (var j = 0; j < data[0].pages[i].statements.length; j++) {
                $('#' + id + "-qs").append("<li><label for ='" + id + "-" + j + "'>" + data[0].pages[i].statements[j] + "</label><div class='answer' id='" + id + "-" + j + "'></div>");
            }

            if (i == 0) {
                $('#' + id).append("<div class='row nav'><div class='progress radius round'><span class='meter'></span></div><a href='#' class='next' title='next'><i class='fa-chevron-circle-right fa'></i></a></div>");
            } else {
                $('#' + id).append("<div class='row nav'><div class='progress radius round'><span class='meter'></span></div><a href='#' class='prev' title='back'><i class='fa-chevron-circle-left fa'></i></a><a href='#' class='next' title='next'><i class='fa-chevron-circle-right fa'></i></a></div>");
            }

            $('#' + id + ' .meter').css("width", i / length * 100 + '%');
            $('#chart').before("</div>");
            //close div


            //set up final page
            if (i == data[0].pages.length - 1) {
                finalPage = id;
            }
        }


        //meter styles



        // append to id rows:
        // <div class='row detail'><h3>title</h3><p>feedback</p></div>


        // set up listeners
        $('.next, .prev').on('click', function () {
            var $this = $(this);

            var $pages = $('.page');


            var pageNum = $this.closest('.page').index();

            $pages.removeClass('active');

            if ($this.hasClass('prev')) {
                pageNum--;
            } else {
                pageNum++;
            }



            $($pages.get(pageNum)).addClass('active');
        });

        //final page functions
        $('#' + finalPage + ' .next').on('click', function () {


            var labels = [];
            var scores = [];
            $('.page').each(function (idx, page) {

                var $page = $(page);
                var label = $page.find('h2').text();

                // split multiword labels with newlines every other word
                label = label.replace(/([^\s]*)\s([^\s]*)\s/, "$1 $2\n");

                var score = 0;
                var hasAnswers = false;
                var answerCount = $(page).find('.answer').length;
                var adjustedCount = answerCount * 20;

                $(page).find('.answer').each(function (idx, answer) {
                    hasAnswers = true;
                    score += parseFloat($(answer).val());

                });

                if (hasAnswers) {

                    let percent = (score / adjustedCount) * 100;
                    scores.push(percent);
                    labels.push(label);

                }
            });

            showChart('canvas', labels, scores);
            //set dimension for showFeedback to be one of the roles selected

            var dimensionRole;
            dimensionRole = '.' + role;

            showFeedback('.feedback ' + dimensionRole + '', '.feedback', scores);

        });

    

        // set up sliders
        var min = 4;
        var max = 20;
        var slider_labels = labels;
        var density = slider_labels.length;

        $('.answer').each(function (idx, slider) {
            $(slider).noUiSliderA11y({
                'step': 4,
                'animate': true,
                'start': min,
                'range': {
                    'min': min,
                    'max': max
                }
            });
            $(slider).noUiSlider_pips({
                'mode': 'steps',
                'density': density,
                'format': {
                    to: function (value) {
                        var numSteps = (max - min) / (density - 1);
                        var idx = (value / numSteps) - 1;

                        if (idx in slider_labels) {
                            return slider_labels[idx];
                        }
                        return '';
                    }
                },
                'filter': function (value) {
                    // labeled steps are large
                    if (value % 4 == 0) {
                        return 1;
                    }
                    // remaining steps are small
                    else {
                        return 0;
                    }
                }
            });
        });





    });



    // Draw the chart based on the current scores
    var radarChart = null;

    function showChart(canvas, labels, scores) {

        var data = {
            'labels': labels,
            'datasets': [
                {
                    'label': "Your results",
                    'fillColor': "rgba(212, 0, 0, 0.2)",
                    'strokeColor': "rgba(212, 0, 0, 1)",
                    'pointColor': "rgba(212, 0, 0, 1)",
                    'pointStrokeColor': "#fff",
                    'pointHighlightFill': "#fff",
                    'pointHighlightStroke': "rgba(151,187,205,1)",
                    'data': scores
                }
            ],
        };

        var config = {
            'scaleShowLabels': false,
            'scaleLabel': "<%= value %>%",
            'scaleFontSize': 10,
            'scaleOverride': true,
            'scaleSteps': 5,
            'scaleStepWidth': 20,
            'scaleStartValue': 0,
            'multiTooltipTemplate': "<%= value %>%",
            'legendTemplate': "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"border-color:<%=datasets[i].strokeColor%>;background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
            'pointLabelFontSize': 16,
            'pointLabelLineHeight': 18,
            'pointLabelDelimiter': "\n"
        };

        // (Re)Create the radar chart
        if (radarChart) radarChart.destroy();
        var ctx = $(canvas).get(0).getContext("2d");
        radarChart = new Chart(ctx).Radar(data, config);

        $('#legend').html(radarChart.generateLegend());
    }


    // feedback for items will only show if the score is not high
    function showFeedback(dimensions, feedback, scores) {
        console.log("feedback!");
        var threshold = dataThreshold;
        var $dimensions = $(dimensions);
        var $feedback = $(feedback);

        console.log($dimensions);


        $(scores).each(function (idx, score) {
            //custom extra step for score above threshold but only for CC
        
            console.log(feedbackJSON[idx]);

            var feedRows = $("#feedbackRows");
            console.log(feedRows);

            if(score < threshold){ //if the score is under the threshold, show it
            feedRows.append("<div class='feedback'><h2>" + feedbackJSON[idx].name + "</h2><p>" + feedbackJSON[idx].text + "</p</div>");
            } else {
                feedRows.append("<div class='feedback hide'><h2>" + feedbackJSON[idx].name + "</h2><p>" + feedbackJSON[idx].text + "</p</div>");
            }

        });
    }








});
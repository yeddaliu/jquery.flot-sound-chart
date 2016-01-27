/* jQuery plugin: Flot Sound Chart 
 * 
 * version: 0.6
 * @author: Yedda Liu
 * date: 2012-04-01
 *
 * Library dependency:
 * - plotting library for jQuery v0.7+
 *    - jquery.flot.js
 *    - jquery.flot.stack.js
 *    - jquery.flot.crosshair.js
 * - jquery v1.7.2+
 * - jquery-ui v1.8.13+
 *    - jquery.ui.core.js
 *    - jquery.ui.mouse.js
 *    - jquery.ui.widget.js
 *    - jquery.ui.draggable.js
 * - excanvas.js (for IE browser only, grant capability to use HTML5 Canvas)
 * 
 * Change log:
 * 2012-09-13 initial version
 * 2012-09-19 add data type validation for options.initControllerValue
 * 2012-10-03 add unit label "dB". Known issue: can't display label at top of axisY.
 * 2012-12-10 support dB rang setting.
 * 2013-04-01 support showing/hiding aixs grid label
 * 2013-07-16 update "dependent js libraries" information
 * 2013-07-30 pack all elements into specified div as "flotSoundchart" and reset related css. 
 */
(function($) {
    $.flotSoundChart = function(element, options) {
        element.append("<div id='flotSoundChart'></div>");
        var $this = $("#flotSoundChart");

        // ****************
        // default config & definition
        // ****************
        var defaultOpts = {
            // required: init db value get from device
            initControllerValue : 0,
            // required: a callback function when user stop drag controller,
            // plugin will pass latest sb value to callback function
            onReleaseController : function(ControllerValue) {
            },
            // required: chart container's width
            width : 574,
            // required: chart container's height
            height : 370,
            // optional: custom class name to override controller's css style,
            // include background image
            controllerClass : '',
            // optional: custom class name to override controller's text css
            // style
            controllerTextClass : '',
            // optional: controller drag size within grid
            controllerDragSize : 1,
            // optional: reset plot's style, and axis settings
            plot : {
                axisX : {
                    min : 1,
                    max : 30,
                    gridSize : 5,
                    showGrid : true
                },
                axisY : {
                    min : 1,
                    max : 100,
                    gridSize : 10,
                    showGrid : true
                },
                // bar chart in downside, means area below base db value
                areaDownside : {
                    label : false,
                    color : "#4ECBDE"
                },
                // bar chart in upside, means area above base db value
                areaUpside : {
                    label : false,
                    color : "#FE5A2B"
                },
                crosslineColor : "#074E57"
            }
        }, axisControl = "y", opt = {}, plot = null, dataDownside = [], dataUpside = [], dataConf = {}, $controller = null, $controllerTextBox = null, controllerOffset = {
            x : 0,
            y : 0
        }, controllerDrag = 0, initPos = {}, limitPos = {}, latestPosition = {}, maxAxisX = 0, minAxisX = 0, showAxisX = 0, maxAxisY = 0, minAxisY = 0, showAxisY = 0, baseValue = 0, $labelY = null, labelAxisY = 'dB', cssLoadCnt = 0, cssTimer = null, controllerTimer = null;

        // ****************
        // help functions
        // ****************
        var resetBasedata = function() {
            for ( var j = 0; j < dataDownside.length; j++) {
                var xVal1 = dataDownside[j][0];
                var yVal1 = dataDownside[j][1];
                var xVal2 = dataUpside[j][0];
                var yVal2 = dataUpside[j][1];
                var totalVal = yVal1 + yVal2;
                yVal1 = (totalVal > baseValue) ? baseValue : totalVal;
                // MUST be 'null' to show nothing
                yVal2 = (totalVal > baseValue) ? (totalVal - baseValue) : null;

                dataDownside[j] = [ xVal1, yVal1 ];
                dataUpside[j] = [ xVal2, yVal2 ];
            }
        }
        var getXTicks = function(max, gap) {
            var data = [];
            for ( var i = 1, j = max; i <= max; i = i + gap, j = j - gap) {
                data.push([ i, j ]);
            }
            return data;
        }
        var getYTicks = function(max, gap) {
            var data = [];
            for ( var i = 0, j = 0; i <= max; i = i + gap, j = j + gap) {
                data.push([ i, j ]);
            }
            return data;
        }
        var updateController = function(curYVal) {
            $controllerTextBox.find("span").html(curYVal);
            controllerTimer = null;
        }
        var isDefaultCssLoad = function() {
            for ( var i = 0; i < document.styleSheets.length; i++) {
                var css = document.styleSheets[i].href;
                var pattern = /^(.*)(flot-sound-chart\.css)$/gi;
                if (pattern.test(css) === true)
                    return true;
            }
            return false;
        }

        // ****************
        // process
        // ****************
        opts = $.extend(true, {}, defaultOpts, options || {});

        // config & initial components
        minAxisX = (typeof opts.plot.axisX.min == "undefined") ? 1 : opts.plot.axisX.min;
        maxAxisX = (typeof opts.plot.axisX.max == "undefined") ? 30 : opts.plot.axisX.max;
        showAxisX = (typeof opts.plot.axisX.showGrid == "undefined") ? true : opts.plot.axisX.showGrid;
        minAxisY = (typeof opts.plot.axisY.min == "undefined") ? 1 : opts.plot.axisY.min;
        maxAxisY = (typeof opts.plot.axisY.max == "undefined") ? 100 : opts.plot.axisY.max;
        showAxisY = (typeof opts.plot.axisY.showGrid == "undefined") ? true : opts.plot.axisY.showGrid;
        baseValue = (typeof opts.initControllerValue == "undefined" || isNaN(opts.initControllerValue)) ? minAxisY : parseInt(opts.initControllerValue);
        baseValue = (baseValue < minAxisY) ? minAxisY : ((baseValue > maxAxisY) ? maxAxisY : baseValue);
        controllerDrag = (typeof opts.controllerDragSize == "undefined" || isNaN(opts.controllerDragSize)) ? 1 : parseInt(opts.controllerDragSize);

        $this.css({
            width : (typeof opts.width == "undefined") ? null : opts.width,
            height : (typeof opts.height == "undefined") ? null : opts.height
        });
        dataConf = [{
            label : (typeof opts.plot.areaDownside.label == "undefined" || opts.plot.areaDownside.label == false) ? null : opts.plot.areaDownside.label,
            color : (typeof opts.plot.areaDownside.color == "undefined") ? "#4ECBDE" : opts.plot.areaDownside.color,
            data : dataDownside
        },{
            label : (typeof opts.plot.areaUpside.label == "undefined" || opts.plot.areaUpside.label == false) ? null : opts.plot.areaUpside.label,
            color : (typeof opts.plot.areaUpside.color == "undefined") ? " #FE5A2B" : opts.plot.areaUpside.color,
            data : dataUpside
        }];

        plot = $.plot($this, dataConf, {
            series : {
                stack : true,
                bars : {
                    show : true,
                    barWidth : 0.6,
                    lineWidth : 0,
                    fillColor : {
                        colors : [ {
                            opacity : 1
                        }, {
                            opacity : 1
                        } ]
                    },
                    align : "center"
                },
                xaxis : 1, // or 2
                yaxis : 1, // or 2
                clickable : false,
                hoverable : false,
                shadowSize : 0
            },
            xaxis : {
                show : showAxisX,
                min : minAxisX,
                max : maxAxisX,
                ticks : getXTicks(
                        maxAxisX,
                        ((typeof opts.plot.axisX.gridSize == "undefined") ? 5
                                : opts.plot.axisX.gridSize))
            },
            yaxis : {
                show : showAxisY,
                min : minAxisY,
                max : maxAxisY,
                ticks : getYTicks(
                        maxAxisY,
                        ((typeof opts.plot.axisY.gridSize == "undefined") ? 10
                                : opts.plot.axisY.gridSize))
            },
            grid : {
                show : true,
                hoverable : false, // *
                autoHighlight : false,
                clickable : false
            // *
            },
            crosshair : {
                mode : axisControl,
                lineWidth : 2,
                color : (typeof opts.plot.crosslineColor == "undefined") ? "#074E57" : opts.plot.crosslineColor
            }
        });

        initPos = plot.p2c({
            x : 1,
            y : baseValue
        });
        limitPos = plot.p2c({
            x : maxAxisX,
            y : minAxisY
        });

        $labelY = $("<div class='labelAxisY' style='position: absolute;'>("
                + labelAxisY + ")</div>");
        $this.append($labelY);

        $controller = $("<div id='controller' class='controller-bar' style='position: absolute;'><div id='dbvalue' class='controller-val'><span></span>"
                + labelAxisY + "</div></div>");
        $this.append($controller);
        if (typeof opts.controllerClass != "undefined" && opts.controllerClass
                && opts.controllerClass != '')
            $controller.removeClass().addClass(opts.controllerClass);

        $controllerTextBox = $("div#dbvalue", $this);
        if (typeof opts.controllerTextClass != "undefined"
                && opts.controllerTextClass && opts.controllerTextClass != '')
            $controllerTextBox.removeClass().addClass(opts.controllerTextClass);

        $controller.draggable({
            axis : axisControl,
            start : function(event, ui) {
                var curTop = ui.position.top;
                latestPosition = plot.c2p({
                    left : 0,
                    top : Math.floor(curTop) + controllerOffset.y
                });
            },
            drag : function(event, ui) {
                var curTop = Math.floor(ui.position.top)
                if (curTop < -controllerOffset.y)
                    return false;
                if (curTop > (limitPos.top - controllerOffset.y))
                    return false;
                //translate canvas position to aix position
                latestPosition = plot.c2p({
                    left : 0,
                    top : curTop + controllerOffset.y
                });
                latestPosition.y = Math.floor(latestPosition.y);
                if (latestPosition.y < minAxisY)
                    latestPosition.y = minAxisY;
                else if (latestPosition.y > maxAxisY)
                    latestPosition.y = maxAxisY;

                plot.setCrosshair({
                    x : 1,
                    y : latestPosition.y
                });

                if (!controllerTimer) {
                    controllerTimer = setTimeout(function() {
                        updateController(latestPosition.y);
                    }, 50);
                }
            },
            stop : function(event, ui) {
                baseValue = (latestPosition.y == minAxisY) ? minAxisY
                        : ((latestPosition.y == maxAxisY) ? maxAxisY : (Math.round(latestPosition.y / controllerDrag) * controllerDrag));
                basePos = plot.p2c({
                    x : maxAxisX,
                    y : baseValue
                });
                //stop current process		
                clearInterval(controllerTimer);
                updateController(baseValue);
                $controller.css({
                    top : (basePos.top - controllerOffset.y)
                });
                //sync hover & click position			
                plot.setCrosshair({
                    x : 1,
                    y : baseValue
                });
                resetBasedata();
                if ($.isFunction(opts.onReleaseController)) {
                    opts.onReleaseController.call($this, baseValue);
                }
                ;
            }
        });

        //actions		
        $controllerTextBox.find("span").html(baseValue);
        cssTimer = setInterval(function() {
            if (isDefaultCssLoad() === true) {
                clearTimeout(cssTimer);
                cssTimer = null;
                //recall controller w/h after css loaded
                controllerOffset = {
                    x : ($controller.width() / 2) - ($.browser.msie ? 8 : 0),
                    y : ($controller.height() / 2) - 5
                }
                $controller.css({
                    left : (plot.width() + controllerOffset.x),
                    top : (initPos.top - controllerOffset.y)
                }).delay(300).show();
                plot.lockCrosshair({
                    x : 1,
                    y : baseValue
                });
            }
            //stop chekcing after 5 swc.
            cssLoadCnt++;
            if (cssLoadCnt >= 10) {
                clearTimeout(cssTimer);
                cssTimer = null;
            }
        }, 500);

        // ****************
        // public methods
        // ****************
        this.run = function() {
        };
        this.stop = function() {
        };
        this.pushCurrentData = function(dbvalue) {
            if (parseInt(dbvalue) == "NaN")
                return;

            var yVal1 = (dbvalue > baseValue) ? baseValue : dbvalue;
            //MUST be 'null' to show nothing
            var yVal2 = (dbvalue > baseValue) ? (dbvalue - baseValue) : null;

            var datum1 = [ maxAxisX, yVal1 ];
            var datum2 = [ maxAxisX, yVal2 ];
            dataDownside.push(datum1);
            dataUpside.push(datum2);

            if (dataDownside.length > (maxAxisX - minAxisX + 1)) {
                // only allow maxrecord points
                dataDownside = dataDownside.splice(1, maxAxisX);
                dataUpside = dataUpside.splice(1, maxAxisX);
            }

            dataConf[0].data = dataDownside;
            dataConf[1].data = dataUpside;
            plot.setData(dataConf);
            plot.setupGrid();
            plot.draw();
            //shift xVal    	
            for ( var i = 0; i < dataDownside.length; i++) {
                dataDownside[i] = [ (dataDownside[i][0] - 1), dataDownside[i][1] ];
                dataUpside[i] = [ (dataUpside[i][0] - 1), dataUpside[i][1] ];
            }
        };

        return this;
    };
})(jQuery);

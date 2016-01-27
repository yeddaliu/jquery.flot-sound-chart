# jquery.flot-sound-chart
A jQuery plugin to show continuous sound dB values in chart based on Plotting Library.

![](https://cloud.githubusercontent.com/assets/1875534/12430007/29121ebe-bf28-11e5-850f-ef3a4cfd0024.jpg "flot-sound-chart UI")

# Dependencies
* plotting library for jQuery v0.7+
  * jquery.flot.js
  * jquery.flot.stack.js
  * jquery.flot.crosshair.js
* jquery v1.7.2+
* jquery-ui v1.8.13+
  * jquery.ui.core.js
  * jquery.ui.mouse.js
  * jquery.ui.widget.js
  * jquery.ui.draggable.js
* excanvas.js <br>For IE browser only, grant capability to use HTML5 Canvas.

# Config Options
| option property   | data type       | default value |description |
| :---------------- | :---------------: | :-----------: | :----------- |
| initControllerValue | number | 50 | Init dB value |
| width | number | 574 |chart container's width |
| height | number | 370 | chart container's height |
| controllerClass | string | "" | custom class name to override controller's css style, including background image |
| controllerTextClass | string | "" | custom class name to override controller's text css style |
| controllerDragSize | number | 1 | controller drag size within grid |
| plot.axisX.min | number | 1 | set plot's axisX min. value |
| plot.axisX.max | number | 30 | set plot's axisX max. value |
| plot.axisX.gridSize | number | 5 | set plot's axisX grid range |
| plot.axisX.showGrid | boolean | true | is show axisX grid line? |
| plot.axisY.min | number | 1 | set plot's axisY min. value |
| plot.axisY.max | number | 100 | set plot's axisY max. value |
| plot.axisY.gridSize | number | 10 | set plot's axisY grid range |
| plot.axisY.showGrid | boolean | true | show axisY grid line? |
| plot.areaDownside.label | boolean | false | show bar chart color in downside of dB controller bar crossline |
| plot.areaDownside.color | string | "#4ECBDE" | set bar chart color in downside of dB controller bar crossline |
| plot.areaUpside.label | boolean | false | show bar chart color in upside of dB controller bar crossline |
| plot.areaUpside.color | string | "#FE5A2B" | set bar chart color in upside of dB controller bar crossline |
| plot.crosslineColor | string | "#074E57" | set crossline color of dB controller bar |

| option method | callback param  | description |
| ------------- | --------------- | ----------- |
| onReleaseController | ControllerValue: number |  callback function when user stop dragging controller, plugin will pass latest dB value to the callback function |
            

# Demo

1. `soundchart1.html`
2. `soundchart2.html` (require.js)

# Change Log
* 2013-07-30 v0.7  Pack all elements into specified div as "flotSoundchart" and reset related css. 
* 2013-07-16 v0.6  Update "dependent js libraries" information
* 2013-04-01 v0.5  Support showing/hiding aixs grid label
* 2012-12-10 v0.4  Support dB rang setting.
* 2012-10-03 v0.3  Add unit label "dB". Known issue: can't display label at top of axisY.
* 2012-09-19 v0.2  Add data type validation for options.initControllerValue
* 2012-09-13 v0.1  Initial version

#TODO
Create AMD version
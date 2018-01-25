'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

exports['default'] = function () {
    return {

        noColors: true,
        slacker: null,

        reportTaskStart: function reportTaskStart(startTime, userAgents, testCount) {
            this.slacker = _child_process2['default'].fork(_path2['default'].resolve(__dirname, 'slacker.js'));
            this.startTime = startTime;
            this.testCount = testCount;

            this.slacker.send({ action: 'sendMessage', data: 'Starting testcafe ' + startTime + '. \n Running tests in: ' + userAgents });
        },

        reportFixtureStart: function reportFixtureStart(name, path) {
            this.currentFixtureName = name;
            this.slacker.send({ action: 'addMessage', data: this.currentFixtureName });
        },

        reportTestDone: function reportTestDone(name, testRunInfo) {
            var hasErr = testRunInfo.errs.length > 0;
            var result = hasErr ? ':heavy_multiplication_x:' : ':heavy_check_mark: ';

            this.slacker.send({ action: 'addMessage', data: result + ' ' + name });

            if (hasErr) {
                this.renderErrors(testRunInfo.errs);
            }
        },

        renderErrors: function renderErrors(errors) {
            var _this = this;

            errors.forEach(function (error, id) {
                var formattedError = _this.formatError(error, id + 1 + ' ');
                _this.slacker.send({
                    action: 'addError',
                    data: { message: formattedError, screenshotPath: error.screenshotPath }
                });
            });
        },

        reportTaskDone: function reportTaskDone(endTime, passed, warnings) {
            var durationMs = endTime - this.startTime;
            var durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
            var footer = passed === this.testCount ? this.testCount + ' passed' : this.testCount - passed + '/' + this.testCount + ' failed';

            footer = '\n*' + footer + '* (Duration: ' + durationStr + ')';

            this.slacker.send({ action: 'addMessage', data: footer });
            this.slacker.send({ action: 'sendReport', data: this.testCount - passed });
        }
    };
};

module.exports = exports['default'];
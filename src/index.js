import child_process from 'child_process'
import path from 'path'

const quiet = process.env['TESTCAFE_SLACK_QUIET'] || false

export default function () {
    return {

        noColors: true,
        slacker: null,

        reportTaskStart (startTime, userAgents, testCount) {
            this.slacker = child_process.fork(path.resolve(__dirname, 'slacker.js'))
            this.startTime = startTime;
            this.testCount = testCount;

            if(!quiet)
                this.slacker.send({ action: 'sendMessage', data: `Starting testcafe ${startTime}. \n Running tests in: ${userAgents}` });
        },

        reportFixtureStart (name, path) {
            this.currentFixtureName = name;
            this.slacker.send({ action: 'addMessage', data: this.currentFixtureName });
        },

        reportTestDone (name, testRunInfo) {
            const hasErr = testRunInfo.errs.length > 0;
            const result = hasErr ? ':heavy_multiplication_x:' : ':heavy_check_mark: ';

            this.slacker.send({ action: 'addMessage', data: `${result} ${name}` });

            if (hasErr) {
                this.renderErrors(testRunInfo.errs);
            }
        },

        renderErrors(errors) {
            errors.forEach((error, id) => {
                const formattedError = this.formatError(error, `${id + 1} `)
                this.slacker.send({
                    action: 'addError',
                    data: { message: formattedError, screenshotPath: error.screenshotPath}
                });
            })
        },

        reportTaskDone (endTime, passed, warnings) {
            const durationMs  = endTime - this.startTime;
            const durationStr = this.moment
                .duration(durationMs)
                .format('h[h] mm[m] ss[s]')
            let footer = passed === this.testCount ?
                `${this.testCount} passed` :
                `${this.testCount - passed}/${this.testCount} failed`;

            footer = `\n*${footer}* (Duration: ${durationStr})`;

            this.slacker.send({ action: 'addMessage', data: footer });
            if(!quiet || this.testCount - passed > 0)
                this.slacker.send({ action: 'sendReport', data: this.testCount - passed });
        }
    }
}

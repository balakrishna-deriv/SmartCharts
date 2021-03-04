import { when } from 'mobx';
import { patchPixelFromChart } from '../utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '../../sass/_themes.scss' or it... Remove this comment to see the full error message
import { red as RED } from '../../sass/_themes.scss';

const is_firefox = navigator.userAgent.search('Firefox') > 0;

class CurrentSpotStore {
    mainStore: any;
    constructor(mainStore: any) {
        this.mainStore = mainStore;
        when(() => this.context, this.onContextReady);
    }

    get context() {
        return this.mainStore.chart.context;
    }
    get stx() {
        return this.context.stx;
    }
    get state() {
        return this.mainStore.state;
    }

    onContextReady = () => {
        if (this.mainStore.state.isAnimationEnabled) this.stx.append('draw', this.drawSpot);
        patchPixelFromChart(this.stx);
    };

    drawSpot = () => {
        if (this.state.endEpoch) {
            return;
        }
        const stx = this.stx;
        const chart = stx.chart;
        let len = chart.dataSet.length;
        if (!len) {
            return;
        }
        let bar = chart.dataSet[len - 1];
        let prevBar = chart.dataSet[len - 2];

        if (!bar || !prevBar || !bar.Close || !prevBar.Close) {
            const dataSetClose = [...chart.dataSet].filter(item => item && item.Close);
            len = dataSetClose.length;
            if (!len) {
                return;
            }
            bar = dataSetClose[len - 1];
            prevBar = dataSetClose[len - 2];
        }

        if (!bar || !prevBar || !bar.Close || !prevBar.Close) {
            return;
        }
        let x = stx.pixelFromTick(len - 1, chart);
        const deltaX = bar.chartJustAdvanced ? x - stx.pixelFromTick(len - 2, chart) : 0;
        const y = stx.pixelFromPrice(bar.Close, chart.panel);

        const progress = Math.min(bar.tickAnimationProgress || 0, 1);
        if (progress) {
            x -= (1 - progress) * deltaX;
        }

        if (x < 0 || x > chart.yAxis.left || y < chart.yAxis.top || y > chart.yAxis.bottom) {
            return;
        }

        // glow is set by Animation.js
        const glow = is_firefox ? 0 : progress;

        /** @type {CanvasRenderingContext2D} */
        const ctx = stx.chart.context;
        ctx.save();
        if (glow) {
            ctx.shadowBlur = (glow * 35 + 4) | 0;
            let opacity = Math.sqrt(1.0 - glow) * 255;
            opacity |= 0;
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number'.
            opacity = opacity.toString(16);
            ctx.shadowColor = RED + opacity;
        }
        ctx.fillStyle = RED;
        for (let i = 0; i < (glow ? 3 : 1); ++i) {
            ctx.beginPath();
            ctx.arc(x - 1, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.restore();
    };
}

export default CurrentSpotStore;

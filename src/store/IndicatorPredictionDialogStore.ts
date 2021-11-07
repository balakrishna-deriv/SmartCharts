import { computed, action, observable } from 'mobx';
import { TMainStore } from 'src/types';
import MenuStore from './MenuStore';
import Menu from '../components/Menu';

export default class IndicatorPredictionDialogStore {
    @observable dialogPortalNodeId = null;
    mainStore: TMainStore;
    menu: MenuStore;
    scrollPanel?: HTMLElement;
    SettingDialogMenu: any;

    constructor({ mainStore }: { mainStore: TMainStore }) {
        this.mainStore = mainStore;
        this.menu = new MenuStore(mainStore, { route: 'indicator-setting' });
        this.SettingDialogMenu = this.menu.connect(Menu);
    }

    @computed get open() {
        return this.menu.open;
    }

    @action.bound setOpen(value: any) {
        if (value && this.scrollPanel) {
            this.scrollPanel.scrollTop = 0;
        }
        return this.menu.setOpen(value);
    }

    @action.bound handleCancel() {
        this.setOpen(false);
    }

    @action.bound handleContinue() {
        this.mainStore.studies.deletePredictionStudies();
        setTimeout(() => {
            this.mainStore.timeperiod.changeGranularity(0);
            this.handleCancel();
        }, 100);
    }
}
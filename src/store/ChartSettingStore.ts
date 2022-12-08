import { observable, action, when, reaction, makeObservable } from 'mobx';
import { TLanguage, TSettings } from 'src/types';
import MainStore from '.';
import Context from '../components/ui/Context';
import { Languages } from '../Constant';
import { LogActions, LogCategories, logEvent } from '../utils/ga';
import MenuStore from './MenuStore';

export default class ChartSettingStore {
    mainStore: MainStore;
    menuStore: MenuStore;

    language: TLanguage | string = '';
    position = 'bottom';
    theme = 'light';
    countdown = false;
    historical = false;
    isAutoScale = true;
    isHighestLowestMarkerEnabled = true;

    constructor(mainStore: MainStore) {
        makeObservable(this, {
            language: observable,
            position: observable,
            theme: observable,
            countdown: observable,
            historical: observable,
            isAutoScale: observable,
            isHighestLowestMarkerEnabled: observable,
            updateActiveLanguage: action.bound,
            setLanguage: action.bound,
            setTheme: action.bound,
            setPosition: action.bound,
            showCountdown: action.bound,
            setHistorical: action.bound,
            setAutoScale: action.bound,
            toggleHighestLowestMarker: action.bound,
        });

        this.defaultLanguage = this.languages[0];
        this.mainStore = mainStore;
        this.menuStore = new MenuStore(mainStore, { route: 'setting' });
        // below reaction is updating the symbols and those elements that are not updating automatically on language change.
        reaction(
            () => (this?.language as TLanguage)?.key,
            () => {
                mainStore?.chart?.activeSymbols?.retrieveActiveSymbols?.(true).then(() => {
                    mainStore?.chart?.changeSymbol?.(mainStore.state.symbol, mainStore.state.granularity, true);
                    mainStore?.chart?.addDeleteElement();
                    mainStore?.chart?.addManageElement();
                });
            }
        );
        when(
            () => !!this.context,
            () => {
                this.setSettings(mainStore.state.settings);
            }
        );
    }
    get context(): Context | null {
        return this.mainStore.chart.context;
    }

    languages: (TLanguage | string)[] = [];
    defaultLanguage = {} as TLanguage | string;
    onSettingsChange?: (newSettings: Omit<TSettings, 'activeLanguages'>) => void = undefined;

    setSettings(settings?: TSettings) {
        if (settings === undefined) {
            return;
        }
        const {
            countdown,
            historical,
            language,
            position,
            isAutoScale,
            isHighestLowestMarkerEnabled,
            theme,
            activeLanguages,
        } = settings;
        if (
            !(
                (!activeLanguages && Languages.every(x => this.languages.find(y => (y as TLanguage).key === x.key))) ||
                (activeLanguages &&
                    this.languages.length === activeLanguages.length &&
                    this.languages.every(x => activeLanguages.indexOf((x as TLanguage).key.toUpperCase()) !== -1))
            )
        ) {
            this.updateActiveLanguage(activeLanguages as Array<string>);
        }
        if (theme !== undefined) {
            this.setTheme(theme);
        }
        if (position !== undefined) {
            this.setPosition(position);
        }
        if (countdown !== undefined) {
            this.showCountdown(countdown);
        }
        if (language !== undefined) {
            this.setLanguage(language);
        }
        if (historical !== undefined) {
            this.setHistorical(historical);
        }
        if (isAutoScale !== undefined) {
            this.setAutoScale(isAutoScale);
        }
        if (isHighestLowestMarkerEnabled !== undefined) {
            this.toggleHighestLowestMarker(isHighestLowestMarkerEnabled);
        }
    }
    saveSetting() {
        if (this.onSettingsChange && this.language) {
            this.onSettingsChange({
                countdown: this.countdown,
                historical: this.historical,
                language: (this.language as TLanguage)?.key,
                position: this.position,
                isAutoScale: this.isAutoScale,
                isHighestLowestMarkerEnabled: this.isHighestLowestMarkerEnabled,
                theme: this.theme,
            });
        }
    }
    updateActiveLanguage(activeLanguages: Array<string>) {
        if (activeLanguages) {
            this.languages = activeLanguages
                .map(lngKey => Languages.find(lng => lng.key.toUpperCase() === lngKey) || '')
                .filter(x => x);
        } else this.languages = Languages;
        // set default language as the first item of active languages or Eng
        this.defaultLanguage = this.languages[0] as TLanguage;
        if (
            (this.language && !this.languages.find(x => (x as TLanguage).key === (this.language as TLanguage)?.key)) ||
            !this.language
        ) {
            this.setLanguage((this.languages[0] as TLanguage).key);
        }
    }
    setLanguage(lng: string) {
        if (!this.languages.length) {
            return;
        }
        if (this.language && lng === (this.language as TLanguage).key) {
            return;
        }
        this.language = this.languages.find(item => (item as TLanguage).key === lng) || this.defaultLanguage;
        t.setLanguage((this.language as TLanguage).key, () => {
            this?.mainStore?.loader?.hide?.();
        });
        logEvent(
            LogCategories.ChartControl,
            LogActions.ChartSetting,
            `Change language to ${(this.language as TLanguage)?.key}`
        );
        this.saveSetting();
    }
    setTheme(theme: string) {
        if (this.theme === theme) {
            return;
        }
        this.theme = theme;
        this.mainStore.chartAdapter.updateTheme(theme);
        if (this.context) {
            this.mainStore.state.setChartTheme(theme);
        }
        logEvent(LogCategories.ChartControl, LogActions.ChartSetting, `Change theme to ${theme}`);
        this.saveSetting();
    }
    setPosition(value: string) {
        if (this.position === value) {
            return;
        }
        this.position = value;
        logEvent(LogCategories.ChartControl, LogActions.ChartSetting, 'Change Position');
        this.saveSetting();
        /**
         * Chart should fix its height & width after the position changed,
         * for that purpose we stay some 10 ms so that position varaible update
         * on chart context then ask chart to update itself hight & width
         */
        setTimeout(() => {
            this.mainStore.chart.resizeScreen();
        }, 10);
        this.menuStore.setOpen(false);
    }
    showCountdown(value: boolean) {
        if (this.countdown === value) {
            return;
        }
        this.countdown = value;
        logEvent(LogCategories.ChartControl, LogActions.ChartSetting, `${value ? 'Show' : 'Hide'} Countdown`);
        this.saveSetting();
    }
    setHistorical(value: boolean) {
        if (this.historical === value) {
            return;
        }
        this.historical = value;
        this.isHighestLowestMarkerEnabled = !value;
        this.saveSetting();
        /**
         * Chart should fix its height & width after the position changed,
         * for that purpose we stay some 10 ms so that position varaible update
         * on chart context then ask chart to update itself hight & width
         */
        setTimeout(() => {
            this.mainStore.chart.resizeScreen();
        }, 10);
    }
    setAutoScale(value: boolean) {
        if (this.isAutoScale === value) {
            return;
        }
        this.isAutoScale = value;
        logEvent(LogCategories.ChartControl, LogActions.ChartSetting, ` Change AutoScale to ${value}`);
        this.saveSetting();
    }
    toggleHighestLowestMarker(value: boolean) {
        if (this.isHighestLowestMarkerEnabled === value) {
            return;
        }
        this.isHighestLowestMarkerEnabled = value;
        logEvent(
            LogCategories.ChartControl,
            LogActions.ChartSetting,
            ` ${value ? 'Show' : 'Hide'} HighestLowestMarker.`
        );
        this.saveSetting();
    }
}

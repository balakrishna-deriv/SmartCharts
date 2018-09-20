import { action, observable, computed, reaction } from 'mobx';
import { connect } from './Connect';
import { cloneCategories, cloneCategory } from '../utils';
import SearchInput from '../components/SearchInput.jsx';
import { NormalItem, ActiveItem, ResultsPanel, FilterPanel } from '../components/categoricaldisplay';

export default class CategoricalDisplayStore {
    constructor({
        getCategoricalItems,
        onSelectItem,
        getIsShown,
        getActiveCategory,
        activeOptions,
        placeholderText,
        favoritesId,
        mainStore,
    }) {
        reaction(getIsShown, () => {
            const isShown = getIsShown();
            // deferred the rendering until user opens the dropdown
            // setTimeout is required, otherwise it will block the render
            setTimeout(action(() => { this.isShown = isShown; }), 0);
            if (isShown) {
                if (!this.isInit) { this.init(); }
            }
        });
        this.getCategoricalItems = getCategoricalItems;
        this.onSelectItem = onSelectItem;
        this.getActiveCategory = getActiveCategory;
        this.favoritesId = favoritesId;
        this.categoryElements = {};
        this.mainStore = mainStore;
        this.isInit = false;

        const normalItem = connect(() => ({
            favoritesId,
        }))(NormalItem);

        const activeItem = connect(() => ({
            activeOptions,
            favoritesId,
        }))(ActiveItem);

        const getItemType = (categoryId) => {
            // Defer render of items until panel is opened
            // if (!this.isShown) {
            //     return BlankItem;
            // }

            if (categoryId === 'active' && (this.getActiveCategory !== undefined)) {
                return activeItem;
            }

            return normalItem;
        };

        this.ResultsPanel = connect(() => ({
            filteredItems: this.filteredItems,
            setCategoryElement: this.setCategoryElement,
            getItemType,
            isShown: this.isShown,
        }))(ResultsPanel);

        this.FilterPanel = connect(({ chart }) => ({
            isMobile: chart.isMobile,
            filteredItems: this.filteredItems,
            handleFilterClick: this.handleFilterClick,
            activeCategoryKey: this.activeCategoryKey,
        }))(FilterPanel);

        this.SearchInput = connect(() => ({
            placeholder: placeholderText,
            value: this.filterText,
            onChange: this.setFilterText,
        }))(SearchInput);
    }

    @observable isShown = false;
    @observable scrollPanel;
    @observable filterText = '';
    @observable activeCategoryKey = '';
    @observable isScrollingDown = false;
    scrollTop = undefined;
    isUserScrolling = true;
    lastFilteredItems = [];

    get context() {
        return this.mainStore.chart.context;
    }

    @action.bound updateScrollSpy() {
        if (this.pauseScrollSpy || !this.scrollPanel) { return; }
        if (this.filteredItems.length === 0) { return; }


        let i = 0;
        for (const category of this.filteredItems) {
            const el = this.categoryElements[category.categoryId];
            if (!el) {
                i++;
                continue;
            }
            const r = el.getBoundingClientRect();
            const top = r.top - this.scrollPanel.getBoundingClientRect().top;
            if (top > 0) { break; }
            i++;
        }

        // get first non-empty category
        let idx = i - 1;
        let id;
        while (idx >= 0) {
            id = this.filteredItems[idx].categoryId;
            if (this.categoryElements[id] !== null) {
                break;
            }
            idx--;
        }

        this.activeCategoryKey = id || this.filteredItems[0].categoryId;
        this.scrollTop = this.scrollPanel.scrollTop;
    }

    @action.bound scrollUp() {
        this.isScrollingDown = false;
    }

    @action.bound scrollDown() {
        // This only affects when scrolling by mouse not by code
        this.isScrollingDown = this.isUserScrolling;
        this.isUserScrolling = true;
    }

    @action.bound init() {
        this.isInit = true;
        // Select first non-empty category:
        if (this.activeCategoryKey === '' && this.filteredItems.length > 0) {
            for (const category of this.filteredItems) {
                const el = this.categoryElements[category.categoryId];
                if (el) {
                    this.activeCategoryKey = category.categoryId;
                    break;
                }
            }
        }
    }

    @computed get favoritesCategory()  {
        const favoritesCategory = {
            categoryName: t.translate('Favorites'),
            categoryId: 'favorite',
            hasSubcategory: false,
            emptyDescription: t.translate('There are no favorites yet.'),
            data: Object.keys(this.mainStore.favorites.favoritesMap[this.favoritesId]) || [],
        };
        return favoritesCategory;
    }

    @computed get filteredItems() {
        let filteredItems = cloneCategories(this.getCategoricalItems());

        if (this.favoritesId) {
            const favsCategory = { ...this.favoritesCategory };
            const findFavItem = (category) => {
                const foundItems = [];
                if (category.hasSubcategory) {
                    category.data.forEach((subcategory) => {
                        const foundSubItems = findFavItem(subcategory);
                        foundItems.push(...foundSubItems);
                    });
                } else {
                    favsCategory.data.forEach((favItem) => {
                        if (typeof favItem === 'string') {
                            const itemObj = category.data.find(item => item.itemId === favItem);
                            if (itemObj) {
                                foundItems.push(itemObj);
                            }
                        }
                    });
                }
                return foundItems;
            };

            const favsCategoryItem = favsCategory.data
                .filter(favItem => (typeof favItem !== 'string'));

            filteredItems.forEach((category) => {
                const foundItems = findFavItem(category);
                favsCategoryItem.push(...foundItems);
            });

            favsCategory.data = favsCategoryItem.filter(favItem => favItem);
            filteredItems.unshift(favsCategory);
        }

        if (this.getActiveCategory) {
            const activeCategory = cloneCategory(this.getActiveCategory());
            filteredItems.unshift(activeCategory);
        }


        if (this.filterText === '') {
            this.lastFilteredItems = filteredItems;
            return filteredItems;
        }


        let searchHasResult = false;
        const queries = this.filterText.split(' ').filter(x => x !== '').map(b => b.toLowerCase().trim());
        // regex to check all separate words by comma, should exist in the string
        const hasSearchString = text => queries.reduce((a, b) => text.toLowerCase().includes(b) && a, true);
        const filterCategory = (c) => {
            c.data = c.data.filter(item => hasSearchString(item.display || (typeof item.dataObject === 'object' && item.dataObject.symbol)));
            if (c.data.length) { searchHasResult = true; }
        };

        for (const category of filteredItems) {
            if (category.hasSubcategory) {
                for (const subcategory of category.data) {
                    filterCategory(subcategory);
                }
            } else {
                filterCategory(category);
            }
        }


        if (!searchHasResult) {
            filteredItems = this.lastFilteredItems;
        }

        this.lastFilteredItems = filteredItems;
        return filteredItems;
    }

    @action.bound setCategoryElement(element, id) {
        this.categoryElements[id] = element;
    }

    @action.bound setFilterText(filterText) {
        this.filterText = filterText;
        this.isUserScrolling = false;
        setTimeout(() => {
            this.updateScrollSpy();
        }, 0);
    }

    @action.bound handleFilterClick(category) {
        const el = this.categoryElements[category.categoryId];

        if (el) {
            // TODO: Scroll animation
            this.pauseScrollSpy = true;
            this.isUserScrolling = false;
            this.scrollPanel.scrollTop = el.offsetTop;
            this.activeCategoryKey = category.categoryId;
            // scrollTop takes some time to take affect, so we need
            // a slight delay before enabling the scroll spy again
            setTimeout(() => { this.pauseScrollSpy = false; }, 3);
        }
    }

    @action.bound setScrollPanel(element) {
        this.scrollPanel = element ? element._container : null;
    }

    connect = connect(() => ({
        filteredItems: this.filteredItems,
        setScrollPanel: this.setScrollPanel,
        isScrollingDown: this.isScrollingDown,
        updateScrollSpy: this.updateScrollSpy,
        scrollUp: this.scrollUp,
        scrollDown: this.scrollDown,
        isShown: this.isShown,
        onSelectItem: this.onSelectItem,
        ResultsPanel: this.ResultsPanel,
        FilterPanel: this.FilterPanel,
        SearchInput: this.SearchInput,
    }))
}

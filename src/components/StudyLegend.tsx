import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
// @ts-expect-error ts-migrate(6142) FIXME: Module './NotificationBadge' was resolved to '... Remove this comment to see the full error message
import NotificationBadge from './NotificationBadge';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Tooltip' was resolved to '/Users/bal... Remove this comment to see the full error message
import Tooltip from './Tooltip';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Scroll' was resolved to '/Users/bala... Remove this comment to see the full error message
import Scroll from './Scroll';
import { connect } from '../store/Connect';
import {
    IndicatorIcon,
    ActiveIcon,
    EmptyStateIcon,
    SettingIcon,
    DeleteIcon,
    InfoCircleIcon,
    BackIcon,
    // @ts-expect-error ts-migrate(6142) FIXME: Module './Icons' was resolved to '/Users/balak... Remove this comment to see the full error message
} from './Icons';
import '../../sass/components/_studylegend.scss';

const StudyIcon = ({ Icon, props }: any) => <Icon {...props} />;

const EmptyView = () => (
    <div className='sc-studies--empty'>
        <EmptyStateIcon />
        <p>{t.translate('You have no active indicators yet.')}</p>
    </div>
);

const NoResultView = ({ text }: any) => (
    <div className='sc-studies--empty'>
        <strong>
            {/* @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 't'. */}
            {t.translate('No results for')} “{text}”
        </strong>
        <p>{t.translate('Try checking your spelling or use a different term')}</p>
    </div>
);

const IndicatorList = ({ items, onSelectItem, onDeleteItem, onEditItem, onInfoItem, disableAll }: any) => (
    <div className='sc-studies__list'>
        {items.map((Item: any) => (
            <Tooltip
                key={`item--${Item.id}`}
                className={`sc-studies__list__item ${disableAll && 'sc-studies__list__item--disabled'}`}
                enabled={!!((onEditItem || onDeleteItem) && Item.bars && Item.bars.length > 30)}
                content={`${Item.name} ${Item.bars ? `(${Item.bars})` : ''}`}
            >
                <div className='info' onClick={() => (onSelectItem ? onSelectItem(Item.id) : null)}>
                    <StudyIcon Icon={Item.icon} />
                    <div className='text'>
                        <span>{Item.name}</span>
                        {Item.bars && <small>({Item.bars})</small>}
                    </div>
                </div>
                <div className='detail'>
                    {onInfoItem && <InfoCircleIcon className='ic-info' onClick={() => onInfoItem(Item)} />}
                    {onEditItem && <SettingIcon onClick={() => onEditItem(Item.dataObject)} />}
                    {onDeleteItem && <DeleteIcon onClick={() => onDeleteItem(Item.dataObject.sd)} />}
                </div>
            </Tooltip>
        ))}
    </div>
);

const TabularDisplaySearchPanel = ({ categories, onSelectItem, onInfoItem, disableAll }: any) => (
    <Scroll autoHide>
        {categories.map((Category: any) => (
            <div key={Category.id} className='sc-studies__category'>
                <div className='sc-studies__category__head'>{Category.name}</div>
                <div className='sc-studies__category__body'>
                    <IndicatorList
                        items={Category.foundItems}
                        onSelectItem={onSelectItem}
                        onInfoItem={onInfoItem}
                        disableAll={disableAll}
                    />
                </div>
                // @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove
                this comment to see the full error message
            </div>
        ))}
    </Scroll>
);

const TabularDisplayActivePanel = ({ items, onDeleteItem, onEditItem, clearAll, isMobile }: any) => (
    <React.Fragment>
        <div className='sc-studies__panel__head'>
            <p>
                {isMobile
                    ? t.translate('Up to 2 active indicators allowed.')
                    : t.translate('Up to 5 active indicators allowed.')}
            </p>
            <button type='button' className='sc-btn sc-btn--sm sc-btn--outline-secondary' onClick={() => clearAll()}>
                {/* @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 't'. */}
                {t.translate('Clear all')}
            </button>
        </div>
        <div className='sc-studies__panel__content sc-studies__panel__content--active'>
            <IndicatorList items={items} onDeleteItem={onDeleteItem} onEditItem={onEditItem} />
        </div>
    </React.Fragment>
);

const TabularDisplay = ({
    onSelectTab,
    selectedTab,
    categories,
    searchedCategories,
    onSelectItem,
    onDeleteItem,
    onEditItem,
    onInfoItem,
    activeItems,
    clearAll,
    searchQuery,
    isMobile,
    maxAllowedItem,
}: any) => (
    <Tabs className='tabs--vertical' selectedIndex={selectedTab} onSelect={onSelectTab}>
        <TabList>
            <Tab key='hidden' className='hidden' />
            <Tab key='active'>
                <ActiveIcon />
                <span>{t.translate('Active')}</span>
                <NotificationBadge notificationCount={activeItems.length} />
            </Tab>
            {categories.map((Category: any) => (
                <Tab key={`tab--${Category.id}`}>
                    <StudyIcon Icon={Category.icon} />
                    <span>{Category.name}</span>
                </Tab>
            ))}
        </TabList>
        <TabPanel key='panel--search'>
            <div className='sc-studies__panel'>
                {searchedCategories.length ? (
                    <TabularDisplaySearchPanel
                        categories={searchedCategories}
                        onSelectItem={onSelectItem}
                        onInfoItem={onInfoItem}
                        disableAll={activeItems.length === (isMobile ? 2 : 5)}
                    />
                ) : (
                    <NoResultView text={searchQuery} />
                )}
            </div>
        </TabPanel>
        <TabPanel key='panel--active'>
            <div className='sc-studies__panel sc-studies__panel--active'>
                {activeItems.length ? (
                    <TabularDisplayActivePanel
                        clearAll={clearAll}
                        items={activeItems}
                        onDeleteItem={onDeleteItem}
                        onEditItem={onEditItem}
                        isMobile={isMobile}
                    />
                ) : (
                    <EmptyView />
                )}
            </div>
        </TabPanel>
        {categories.map((Category: any) => (
            <TabPanel key={`panel--${Category.id}`}>
                <div className='sc-studies__panel'>
                    <h3>{Category.name}</h3>
                    <IndicatorList
                        onSelectItem={onSelectItem}
                        onInfoItem={onInfoItem}
                        items={Category.items}
                        disableAll={activeItems.length === maxAllowedItem}
                    />
                </div>
            </TabPanel>
        ))}
    </Tabs>
);

const StudyLegend = ({
    isOpened,
    setOpen,
    StudyMenu,
    menuOpen,
    isMobile,
    activeStudiesNo,
    items,
    searchedItems,
    SearchInput,
    searchQuery,
    selectedTab,
    onSelectTab,
    onSelectItem,
    onInfoItem,
    activeItems,
    deleteAll,
    deleteStudy,
    editStudy,
    infoItem,
    portalNodeId,
    updatePortalNode,
    maxAllowedItem,
}: any) => {
    updatePortalNode(portalNodeId);
    return (
        <StudyMenu
            className='sc-studies'
            isOpened={isOpened}
            setOpen={setOpen}
            isMobile={isMobile}
            title={t.translate('Indicators')}
            tooltip={t.translate('Indicators')}
            modalMode
            enableTabular
            portalNodeId={portalNodeId}
            customHead={
                infoItem ? (
                    <div className='sc-dialog__head--info'>
                        <BackIcon onClick={() => onInfoItem(null)} />
                        {infoItem.name}
                    </div>
                ) : (
                    <div className='sc-dialog__head--search'>
                        <SearchInput />
                    </div>
                )
            }
        >
            <StudyMenu.Title>
                <div className={`sc-studies__menu ${menuOpen ? 'sc-studies__menu--active' : ''}`}>
                    <IndicatorIcon />
                    <NotificationBadge notificationCount={activeStudiesNo} />
                </div>
            </StudyMenu.Title>
            <StudyMenu.Body>
                {infoItem && (
                    <div className='sc-studies__info'>
                        <Scroll autoHide height='360px' className='studies__info__content'>
                            <p>{infoItem.description}</p>
                        </Scroll>
                        <button
                            type='button'
                            className='sc-btn sc-btn--primary sc-btn--w100'
                            onClick={() => onSelectItem(infoItem.id)}
                        >
                            {/* @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 't'. */}
                            {t.translate('Add')}
                        </button>
                    </div>
                )}
                <TabularDisplay
                    onSelectTab={onSelectTab}
                    selectedTab={selectedTab}
                    categories={items}
                    searchedCategories={searchedItems}
                    onSelectItem={onSelectItem}
                    onDeleteItem={deleteStudy}
                    onEditItem={editStudy}
                    onInfoItem={onInfoItem}
                    activeItems={activeItems}
                    clearAll={deleteAll}
                    searchQuery={searchQuery}
                    isMobile={isMobile}
                    maxAllowedItem={maxAllowedItem}
                />
            </StudyMenu.Body>
        </StudyMenu>
    );
};

export default connect(({ studies: st, chart }: any) => ({
    isOpened: st.open,
    setOpen: st.setOpen,
    StudyMenu: st.StudyMenu,
    menuOpen: st.menu.open,
    isMobile: chart.isMobile,
    activeStudiesNo: st.activeItems.length,
    deleteAll: st.deleteAllStudies,
    items: st.items,
    searchedItems: st.searchedItems,
    SearchInput: st.SearchInput,
    searchQuery: st.filterText,
    selectedTab: st.selectedTab,
    onSelectTab: st.onSelectTab,
    onSelectItem: st.onSelectItem,
    activeItems: st.activeItems,
    deleteStudy: st.deleteStudy,
    editStudy: st.editStudy,
    onInfoItem: st.onInfoItem,
    infoItem: st.infoItem,
    updatePortalNode: st.updatePortalNode,
    maxAllowedItem: st.maxAllowedItem,
}))(StudyLegend);

// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchBar from '@components/search';
import { changeOpacity, getKeyboardAppearanceFromTheme, makeStyleSheetFromTheme } from '@utils/theme';
import { General } from '@constants';
import { useTheme } from '@context/theme';
import FormattedText from '@components/formatted_text';
import { View as ViewConstants } from '@constants';
import {
    popTopScreen,
} from '@screens/navigation';

import CustomList, { FLATLIST, SECTIONLIST } from './custom_list';
import OptionListRow from './option_list_row';
import ChannelListRow from './channel_list_row';
import UserListRow from './user_list_row';
import { useIntl } from 'react-intl';
import { debounce } from '@app/helpers/api/general';
import SelectedOptions from './selected_options';

type Selection = DialogOption | Channel | UserProfile | DialogOption[] | Channel[] | UserProfile[];
type Props = {
    // actions: {
    //     getProfiles: (page?: number, perPage?: number, options?: any) => Promise<ActionResult>;
    //     getChannels: (teamId: string, page?: number, perPage?: number) => Promise<ActionResult>;
    //     searchProfiles: (term: string, options?: any) => Promise<ActionResult>;
    //     searchChannels: (teamId: string, term: string, archived?: boolean | undefined) => Promise<ActionResult>;
    // };
    // getDynamicOptions?: (term: string) => Promise<ActionResult>;
    actions: any,
    currentTeamId: string;
    data: object[];
    dataSource: string;
    onSelect: (opt: Selection) => void;
    isMultiselect?: boolean;
    selected?: DialogOption[];
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
        },
        searchBar: {
            marginVertical: 5,
            height: 38,
        },
        loadingContainer: {
            alignItems: 'center',
            backgroundColor: theme.centerChannelBg,
            height: 70,
            justifyContent: 'center',
        },
        loadingText: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
        },
        noResultContainer: {
            flexGrow: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        noResultText: {
            fontSize: 26,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        separator: {
            height: 1,
            flex: 0,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
    };
});


function IntegrationSelector(
    { dataSource, data, isMultiselect, selected, onSelect, actions, currentTeamId }: Props) {
    // TODO State
    // type State = {
    //     data: DataType | Array<{ id: string; data: DataType }>;
    //     loading: boolean;
    //     searchResults: DialogOption[];
    //     term: string;
    //     multiselectSelected: MultiselectSelectedMap;
    // }

    const theme = useTheme();
    const style = getStyleSheet(theme);
    const searchBarInput = {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        color: theme.centerChannelColor,
        fontSize: 15,
    };
    const intl = useIntl();
    // TODO DataSource


    // navigationEventListener ?: EventSubscription;
    const searchTimeoutId = 0;
    const page = -1;
    // const next: boolean;
    // const searchBarRef = React.createRef<SearchBar>();
    // const selectedScroll = React.createRef<ScrollView>();

    // Constructor
    const next = dataSource === ViewConstants.DATA_SOURCE_USERS || dataSource === ViewConstants.DATA_SOURCE_CHANNELS || dataSource === ViewConstants.DATA_SOURCE_DYNAMIC;

    // const multiselectSelected: MultiselectSelectedMap = {};
    // if (isMultiselect && selected && !([ViewConstants.DATA_SOURCE_USERS, ViewConstants.DATA_SOURCE_CHANNELS].includes(props.dataSource))) {
    //     selected.forEach((opt) => {
    //         multiselectSelected[opt.value] = opt;
    //     });
    // }

    // this.state = {
    //     data,
    //     loading: false,
    //     searchResults: [],
    //     term: '',
    //     multiselectSelected,
    // };

    // Callbacks
    // TODO This is a effect
    const componentDidMount = () => {
        // this.navigationEventListener = Navigation.events().bindComponent(this);

        if (dataSource === ViewConstants.DATA_SOURCE_USERS) {
            getProfiles();
        } else if (dataSource === ViewConstants.DATA_SOURCE_CHANNELS) {
            getChannels();
        } else if (dataSource === ViewConstants.DATA_SOURCE_DYNAMIC) {
            getDynamicOptions();
        }
    }

    const clearSearch = () => {
        this.setState({ term: '', searchResults: [] });
    };

    const close = () => {
        popTopScreen();
    };

    const handleSelectItem = (id: string, item: UserProfile | Channel | DialogOption) => {
        if (!isMultiselect) {
            onSelect(item);
            close();
            return;
        }

        switch (dataSource) {
            case ViewConstants.DATA_SOURCE_USERS: {
                const currentSelected = this.state.multiselectSelected as Dictionary<UserProfile>;
                const typedItem = item as UserProfile;
                const multiselectSelected = { ...currentSelected };
                if (currentSelected[typedItem.id]) {
                    delete multiselectSelected[typedItem.id];
                } else {
                    multiselectSelected[typedItem.id] = typedItem;
                }
                this.setState({ multiselectSelected });
                break;
            }
            case ViewConstants.DATA_SOURCE_CHANNELS: {
                const currentSelected = this.state.multiselectSelected as Dictionary<Channel>;
                const typedItem = item as Channel;
                const multiselectSelected = { ...currentSelected };
                if (currentSelected[typedItem.id]) {
                    delete multiselectSelected[typedItem.id];
                } else {
                    multiselectSelected[typedItem.id] = typedItem;
                }
                this.setState({ multiselectSelected });
                break;
            }
            default: {
                const currentSelected = this.state.multiselectSelected as Dictionary<DialogOption>;
                const typedItem = item as DialogOption;
                const multiselectSelected = { ...currentSelected };
                if (currentSelected[typedItem.value]) {
                    delete multiselectSelected[typedItem.value];
                } else {
                    multiselectSelected[typedItem.value] = typedItem;
                }
                this.setState({ multiselectSelected });
            }
        }

        setTimeout(() => {
            if (this.selectedScroll.current) {
                this.selectedScroll.current.scrollToEnd();
            }
        });
    };

    // const navigationButtonPressed = ({ buttonId }: { buttonId: string }) => {
    //     switch (buttonId) {
    //         case 'submit-form':
    //             onSelect(Object.values(this.state.multiselectSelected));
    //             close();
    //             return;
    //         case 'close-dialog':
    //             close();
    //     }
    // }

    const handleRemoveOption = (item: UserProfile | Channel | DialogOption) => {
        switch (dataSource) {
            case ViewConstants.DATA_SOURCE_USERS: {
                const currentSelected = this.state.multiselectSelected as Dictionary<UserProfile>;
                const typedItem = item as UserProfile;
                const multiselectSelected = { ...currentSelected };
                delete multiselectSelected[typedItem.id];
                this.setState({ multiselectSelected });
                return;
            }
            case ViewConstants.DATA_SOURCE_CHANNELS: {
                const currentSelected = this.state.multiselectSelected as Dictionary<Channel>;
                const typedItem = item as Channel;
                const multiselectSelected = { ...currentSelected };
                delete multiselectSelected[typedItem.id];
                this.setState({ multiselectSelected });
                return;
            }
            default: {
                const currentSelected = this.state.multiselectSelected as Dictionary<DialogOption>;
                const typedItem = item as DialogOption;
                const multiselectSelected = { ...currentSelected };
                delete multiselectSelected[typedItem.value];
                this.setState({ multiselectSelected });
            }
        }
    };

    const getChannels = debounce(() => {
        const { loading, term } = this.state;
        if (this.next && !loading && !term) {
            this.setState({ loading: true }, () => {
                actions.getChannels(
                    currentTeamId,
                    this.page += 1,
                    General.CHANNELS_CHUNK_SIZE,
                ).then(loadedChannels);
            });
        }
    }, 100);

    const getDataResults = () => {
        const result = {
            data: data as any,
            listType: FLATLIST
        };
        if (term) {
            // result.data = filterSearchData(dataSource, searchResults, term);
        } else if (dataSource === ViewConstants.DATA_SOURCE_USERS) {
            // result.data = createProfilesSections(data);
            result.listType = SECTIONLIST;
        }

        if (!dataSource || dataSource === ViewConstants.DATA_SOURCE_DYNAMIC) {
            result.data = result.data.map((value: DialogOption) => {
                return { ...value, id: (value).value };
            });
        }

        return result;
    };

    const getProfiles = debounce(() => {
        const { loading, term } = this.state;
        if (this.next && !loading && !term) {
            this.setState({ loading: true }, () => {
                actions.getProfiles(
                    this.page + 1,
                    General.PROFILE_CHUNK_SIZE,
                ).then(loadedProfiles);
            });
        }
    }, 100);

    const getDynamicOptions = debounce(() => {
        const { loading, term } = this.state;
        if (this.next && !loading && !term) {
            this.searchDynamicOptions('');
        }
    }, 100);

    const loadedChannels = ({ data: channels }: { data: Channel[] }) => {
        if (channels && !channels.length) {
            this.next = false;
        }

        const channelData = data as Channel[]

        this.page += 1;
        this.setState({ loading: false, data: [...channels, ...channelData] });
    };

    const loadedProfiles = ({ data: profiles }: { data: UserProfile[] }) => {
        if (profiles && !profiles.length) {
            this.next = false;
        }

        const userData = data as UserProfile[];

        this.page += 1;
        this.setState({ loading: false, data: [...profiles, ...userData] });
    };

    const loadMore = () => {
        if (dataSource === ViewConstants.DATA_SOURCE_USERS) {
            this.getProfiles();
        } else if (dataSource === ViewConstants.DATA_SOURCE_CHANNELS) {
            this.getChannels();
        }

        // dynamic options are not paged so are not reloaded on scroll
    };

    const searchChannels = (term: string) => {
        actions.searchChannels(currentTeamId, term.toLowerCase()).then(({ data }: any) => {  // TODO
            this.setState({ searchResults: data, loading: false });
        });
    };

    const searchProfiles = (term: string) => {
        this.setState({ loading: true });

        actions.searchProfiles(term.toLowerCase()).then((results: any) => {  // TODO
            let data = [];
            if (results.data) {
                data = results.data;
            }
            this.setState({ searchResults: data, loading: false });
        });
    };

    const searchDynamicOptions = (term = '') => {
        if (!getDynamicOptions) {
            return;
        }

        this.setState({ loading: true });

        // getDynamicOptions(term.toLowerCase()).then((results: any) => {  // TODO
        //     let data = [];
        //     if (results.data) {
        //         data = results.data;
        //     }

        //     if (term) {
        //         this.setState({ searchResults: data, loading: false });
        //     } else {
        //         this.setState({ data, loading: false });
        //     }
        // });
    };

    const onSearch = (text: string) => {
        if (text) {
            this.setState({ term: text });
            clearTimeout(this.searchTimeoutId);

            this.searchTimeoutId = setTimeout(() => {
                if (!dataSource) {
                    // this.setState({ searchResults: filterSearchData(null, data, text) });
                    return;
                }

                if (dataSource === ViewConstants.DATA_SOURCE_USERS) {
                    searchProfiles(text);
                } else if (dataSource === ViewConstants.DATA_SOURCE_CHANNELS) {
                    searchChannels(text);
                } else if (dataSource === ViewConstants.DATA_SOURCE_DYNAMIC) {
                    searchDynamicOptions(text);
                }
            }, General.SEARCH_TIMEOUT_MILLISECONDS) as any;
        } else {
            this.clearSearch();
        }
    };

    const renderLoading = () => {
        const { loading } = this.state;

        if (!loading) {
            return null;
        }

        let text;
        switch (dataSource) {
            case ViewConstants.DATA_SOURCE_USERS:
                // text = loadingText;
                break;
            case ViewConstants.DATA_SOURCE_CHANNELS:
                text = {
                    id: intl.formatMessage({ id: 'mobile.loading_channels' }),
                    defaultMessage: 'Loading Channels...',
                };
                break;
            default:
                text = {
                    id: intl.formatMessage({ id: 'mobile.loading_options' }),
                    defaultMessage: 'Loading Options...',
                };
                break;
        }

        return (
            <View style={style.loadingContainer}>
                <FormattedText
                    id='mobile.custom_list.loading'
                    {...text}
                    style={style.loadingText}
                />
            </View>
        );
    };

    const renderNoResults = (): JSX.Element | null => {
        if (loading || this.page === -1) {
            return null;
        }

        return (
            <View style={style.noResultContainer}>
                <FormattedText
                    id='mobile.custom_list.no_results'
                    defaultMessage='No Results'
                    style={style.noResultText}
                />
            </View>
        );
    };

    const renderChannelItem = (props: any) => {
        const selected = Boolean(this.state.multiselectSelected[props.id]);
        return (
            <ChannelListRow
                key={props.id}
                {...props}
                selectable={true}
                selected={selected}
            />
        );
    };

    const renderOptionItem = (props: any) => {
        const selected = Boolean(this.state.multiselectSelected[props.id]);
        return (
            <OptionListRow
                key={props.id}
                {...props}
                selectable={true}
                selected={selected}
            />
        );
    };

    const renderUserItem = (props: any) => {
        const selected = Boolean(this.state.multiselectSelected[props.id]);
        return (
            <UserListRow
                key={props.id}
                {...props}
                selectable={true}
                selected={selected}
            />
        );
    };

    const { loading, term } = this.state;

    let rowComponent;
    if (dataSource === ViewConstants.DATA_SOURCE_USERS) {
        rowComponent = renderUserItem;
    } else if (dataSource === ViewConstants.DATA_SOURCE_CHANNELS) {
        rowComponent = renderChannelItem;
    } else {
        rowComponent = renderOptionItem;
    }

    const { listType } = getDataResults();

    let selectedOptionsComponent = null;
    const selectedItems: any = Object.values(this.state.multiselectSelected);  // TODO
    if (selectedItems.length > 0) {
        selectedOptionsComponent = (
            <>
                <SelectedOptions
                    // ref={selectedScroll}
                    theme={theme}
                    selectedOptions={selectedItems}
                    dataSource={dataSource}
                    onRemove={handleRemoveOption}
                />
                <View style={style.separator} />
            </>
        );
    }

    return (
        <SafeAreaView style={style.container}>
            <View
                testID='integration_selector.screen'
                style={style.searchBar}
            >
                <SearchBar
                    testID='selector.search_bar'
                    // ref={searchBarRef}
                    placeholder={intl.formatMessage({ id: 'search_bar.search', defaultMessage: 'Search' })}
                    // cancelTitle={intl.formatMessage({ id: 'mobile.post.cancel', defaultMessage: 'Cancel' })}
                    // backgroundColor='transparent'
                    // inputHeight={33}
                    inputStyle={searchBarInput}
                    placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                    // tintColorSearch={changeOpacity(theme.centerChannelColor, 0.5)}
                    // tintColorDelete={changeOpacity(theme.centerChannelColor, 0.5)}
                    // titleCancelColor={theme.centerChannelColor}
                    onChangeText={onSearch}
                    // onSearchButtonPress={onSearch}
                    // onCancelButtonPress={clearSearch}
                    autoCapitalize='none'
                    keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                    value={term}
                />
            </View>

            {selectedOptionsComponent}

            <CustomList
                data={data}
                key='custom_list'
                listType={listType}
                loading={loading}
                loadingComponent={renderLoading()}
                noResults={renderNoResults}
                onLoadMore={loadMore}
                onRowPress={handleSelectItem}
                renderItem={rowComponent}
                theme={theme}
            />
        </SafeAreaView>
    );
}

export default IntegrationSelector;

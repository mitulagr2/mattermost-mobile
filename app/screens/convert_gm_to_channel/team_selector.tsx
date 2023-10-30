// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useCallback, useEffect, useState } from 'react';
import {useIntl} from 'react-intl';
import {Platform} from 'react-native';

import OptionItem from '@app/components/option_item';
import {Screens} from '@app/constants';
import {useTheme} from '@app/context/theme';
import {dismissBottomSheet, goToScreen} from '@app/screens/navigation';
import {preventDoubleTap} from '@app/utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@app/utils/theme';
import { logDebug } from '@app/utils/log';

const getStyleFromTheme = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        teamSelector: {
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.08),
        },
    };
});

type Props = {
    commonTeams: Team[];
    onSelectTeam: (team: Team) => void;
    selectedTeamId?: string;
}

export const TeamSelector = ({commonTeams, onSelectTeam, selectedTeamId}: Props) => {
    const {formatMessage} = useIntl();
    const theme = useTheme();
    const styles = getStyleFromTheme(theme);

    const [selectedTeam, setSelectedTeam] = useState<Team>();

    const label = formatMessage({id: 'channel_into.convert_gm_to_channel.team_selector.label', defaultMessage: 'Team'});
    const placeholder = formatMessage({id: 'channel_into.convert_gm_to_channel.team_selector.placeholder', defaultMessage: 'Select a Team'});

    useEffect(() => {
        logDebug(`AAA selectedTeamId: ${selectedTeamId}`);
        if (selectedTeamId) {
            const team = commonTeams.find((t) => t.id === selectedTeamId);
            logDebug(`AAA team: ${team?.display_name}`);
            setSelectedTeam(team);
        }
    }, [selectedTeamId]);

    const selectTeam = useCallback((teamId: string) => {
        const team = commonTeams.find((t) => t.id === teamId);
        if (team) {
            setSelectedTeam(team);
            onSelectTeam(team);
        }
    }, []);

    const goToTeamSelectorList = preventDoubleTap(async () => {
        await dismissBottomSheet();

        const title = formatMessage({id: 'channel_info.convert_gm_to_channel.team_selector_list.title', defaultMessage: 'Select Team'});
        goToScreen(Screens.TEAM_SELECTOR_LIST, title, {teams: commonTeams, selectTeam, selectedTeamId});
    });

    return (
        <OptionItem
            action={goToTeamSelectorList}
            containerStyle={styles.teamSelector}
            label={label}
            type={Platform.select({ios: 'arrow', default: 'default'})}
            info={selectedTeam ? selectedTeam.display_name : placeholder}
            labelContainerStyle={{flexShrink: 0}}
        />
    );
};

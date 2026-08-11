namespace pxsim {
    // The inherited mixer stop-all callback calls muteAllChannels again. Guard
    // the exported entry point so a sequencer cannot recurse during teardown.
    const inheritedMuteAllChannels = AudioContextManager.muteAllChannels;
    let muteAllChannelsInProgress = false;

    AudioContextManager.muteAllChannels = function () {
        if (muteAllChannelsInProgress) return;

        muteAllChannelsInProgress = true;
        try {
            inheritedMuteAllChannels();
        } finally {
            muteAllChannelsInProgress = false;
        }
    };
}

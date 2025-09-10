import React, { Component } from 'react';
import io from 'socket.io-client';

class ChannelList extends Component {
    
    const channelData = {
  channel_name: [
    "achannel", "bchannel", "cchannel", "dchannel", "echannel"
  ],
  dmchannel: [
    "dmAchannel", "dmBchannel", "dmCchannel", "dmDchannel"
  ]
};
  constructor(props) {
    super(props);
    this.state = {
      channel_name: [],
      dmchannel: []
    };

    this.socket = io("http://localhost:4000"); // 서버 주소
  }

  componentDidMount() {
    // 서버에서 채널 리스트를 받음
    this.socket.on("channelList", (data) => {
      this.setState({
        channel_name: data.channel_name || [],
        dmchannel: data.dmchannel || []
      });
    });

    // 최초 요청
    this.socket.emit("getChannelList");
  }

  componentWillUnmount() {
    // 메모리 누수 방지를 위해 이벤트 제거
    this.socket.off("channelList");
  }

  render() {
    const { channel_name, dmchannel } = this.state;

    return (
      <div>
        {/* Channel */}
        {channel_name.map((ch, idx) => (
          <div key={`channel-${idx}`}>
            - [Channel] {ch}
          </div>
        ))}

        {/* DM */}
        {dmchannel.map((dm, idx) => (
          <div key={`dm-${idx}`}>
            - [DM] {dm}
          </div>
        ))}
      </div>
    );
  }
}

export default ChannelList;
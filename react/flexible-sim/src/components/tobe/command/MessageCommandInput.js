import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setInput, setPreview, clearPreview } from '../../../features/command/commandSlice';
import { resolveCommand } from '../../../store/commandRegistry';

class MessageCommandInput extends Component {
    onChange = (e) => {
        const value = e.target.value;
        this.props.setInput(value);

        const found = resolveCommand(value);
        if (!found) {
            this.props.clearPreview();
        } else {
            const text = found.def.preview(found.args);
            this.props.setPreview(text, found);
        }
    };

    onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const { input, activeCmd } = this.props;
            if (activeCmd) {
                // 커맨드 실행
                activeCmd.def.handler(this.props.dispatch, activeCmd.args, input, this.props.getState);
                this.props.setInput('');
                this.props.clearPreview();
            } else {
                // 일반 메시지 전송(실무: 소켓 전송 → Redux 메시지 추가)
                this.props.dispatch({ type: 'message/SEND', payload: { text: input } });
                this.props.setInput('');
            }
        } else if (e.key === 'Escape') {
            this.props.clearPreview();
        }
    };

    render() {
        const { input, previewText, activeCmd } = this.props;
        return (
            <div className="cmd-wrap">
                {previewText ? (
                    <div className="cmd-preview">
                        <div className="cmd-title">
                            {activeCmd ? activeCmd.cmd : ''} 미리보기
                        </div>
                        <div className="cmd-body">{previewText}</div>
                    </div>
                ) : null}

                <textarea
                    className="cmd-input"
                    rows={2}
                    placeholder="메시지 입력… (/gpt, /poll, /remind 지원)"
                    value={input}
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                />
            </div>
        );
    }
}

MessageCommandInput.propTypes = {
    input: PropTypes.string.isRequired,
    previewText: PropTypes.string.isRequired,
    activeCmd: PropTypes.object,
    setInput: PropTypes.func.isRequired,
    setPreview: PropTypes.func.isRequired,
    clearPreview: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
};

const mapState = state => ({
    input: state.command.input,
    previewText: state.command.previewText,
    activeCmd: state.command.activeCmd,
});
const mapDispatch = (dispatch, getState) => ({
    dispatch,
    getState,
    setInput: v => dispatch(setInput(v)),
    setPreview: (text, activeCmd) => dispatch(setPreview(text, activeCmd)),
    clearPreview: () => dispatch(clearPreview()),
});

export default connect(mapState, mapDispatch)(MessageCommandInput);

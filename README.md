# dev-notes
기술 문서
     return (
            <div
                className="flex-col flex-radio-img-group"
                style={{ flex: flex || 1, overflowX: 'auto' }}
            >
                {control.label && <span className="flex-label">{this.getText(control.label)}</span>}
                <div className="flex-radio-img-carousel">
                    {control.options.map(opt => (
                        <label
                            key
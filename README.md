# dev-notes
기술 문서
case 'radio':
    if (control.options.some(opt => opt.img)) {
        // 이미지+라디오 캐러셀 (좌우 스크롤)
        return (
            <div
                className="flex-col flex-radio-img-group"
                style={{ flex: flex || 1, overflowX: 'auto' }}
            >
                {control.label && <span className="flex-label">{this.getText(control.label)}</span>}
                <div className="flex-radio-img-carousel">
                    {control.options.map(opt => (
                        <label
                            key={opt.value}
                            className={
                              "flex-radio-img-label" +
                              (this.state[control.processId] === opt.value ? " selected" : "")
                            }
                            style={{
                                minWidth: 110,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginRight: 18,
                                cursor: 'pointer'
                            }}
                        >
                            <input
                                type="radio"
                                name={control.processId}
                                value={opt.value}
                                checked={this.state[control.processId] === opt.value}
                                onChange={() => this.handleChange(control.processId, opt.value)}
                                style={{ display: "none" }}
                            />
                            <img
                                src={opt.img}
                                alt={this.getText(opt.label)}
                                className="flex-radio-img"
                                style={{
                                    width: 82,
                                    height: 82,
                                    objectFit: "cover",
                                    borderRadius: 13,
                                    boxShadow: this.state[control.processId] === opt.value
                                      ? "0 0 0 3px #2784eb"
                                      : "0 1px 8px #e5eaf3",
                                    border: "2px solid " + (this.state[control.processId] === opt.value ? "#2784eb" : "#fff"),
                                    transition: "box-shadow .14s, border-color .14s",
                                    marginBottom: 10
                                }}
                            />
                            <span
                                className="flex-radio-img-caption"
                                style={{
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: this.state[control.processId] === opt.value ? "#2784eb" : "#444",
                                    marginTop: 5
                                }}
                            >
                                {this.getText(opt.label)}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        );
    } else {
        // 일반 라디오
        ...
    }
.flex-radio-img-carousel {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0 12px;
    overflow-x: auto;
    padding-bottom: 3px;
    /* 모바일에서도 스크롤바 자연스럽게 */
    scrollbar-width: thin;
}
.flex-radio-img-label.selected .flex-radio-img {
    border-color: #2784eb;
    box-shadow: 0 0 0 3px #2784eb;
}
.flex-radio-img {
    transition: box-shadow 0.14s, border-color 0.14s;
}
.flex-radio-img-caption {
    white-space: nowrap;
}

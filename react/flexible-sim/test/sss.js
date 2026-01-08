componentDidMount() {
  let _this = this;

  let finalMarkdown = "해당 메시지는 마크다운 뷰어를 지원하지 않는 내용이 포함되어 있습니다. 관리자에게 문의하세요.";

  const initSlimscroll = () => {
    // 이미 초기화 되어 있으면 중복 방지
    if (_this.slimscrollInited) return;
    _this.slimscrollInited = true;

    _this.raf = requestAnimationFrame(() => {
      try {
        _this.slimscroll = new slimscroll({
          idSelector: '.sourceBody',
          width: '100%',
          height: '100%'
        });
        _this.slimscroll.init();
      } catch (e) {
        console.error('slimscroll init error', e);
      }
    });
  };

  if (this.params.threadid) {
    const thread_id = this.params.threadid;
    const message_id = this.params.messageid;

    this.airunner
      .selectAIRichmessage(Number(thread_id), message_id)
      .then((res) => {
        const rich = res.richnotification.content;
        let contentRaw = _this.transformDataToMarkdown(rich);

        if (contentRaw !== undefined && contentRaw !== null && contentRaw !== '') {
          finalMarkdown = contentRaw;
        }

        _this.setState(
          {
            markdownText: finalMarkdown,
            isLoading: false
          },
          initSlimscroll          // ✅ 내용 세팅된 후 slimscroll 초기화
        );
      })
      .catch(error => {
        console.error("마크다운 데이터를 불러오는 중 오류 발생:", error);
        _this.setState(
          {
            markdownText: "데이터를 불러오는 중 오류가 발생했습니다.",
            isLoading: false
          },
          initSlimscroll
        );
      });
  } else if (this.props.content) {
    const rich = this.props.content.content;
    let contentRaw = this.transformDataToMarkdown(rich);
    if (contentRaw !== undefined && contentRaw !== null && contentRaw !== '') {
      finalMarkdown = contentRaw;
    }
    _this.setState(
      {
        markdownText: finalMarkdown,
        isLoading: false
      },
      initSlimscroll
    );
  } else {
    // 데이터가 아예 없는 경우에도 slimscroll는 필요할 수 있으니
    this.setState(
      {
        markdownText: finalMarkdown,
        isLoading: false
      },
      initSlimscroll
    );
  }
}
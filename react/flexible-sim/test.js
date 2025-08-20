import React from "react";

class DropdownBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false }; // 박스 열림 여부
    this.boxRef = React.createRef();    // 박스 영역 참조
    this.buttonRef = React.createRef(); // 버튼 참조
  }

  componentDidMount() {
    // 문서 전체 클릭 이벤트 등록
    document.addEventListener("mousedown", this.handleClickOutside);
        document.addEventListener('contextmenu', event => event.preventDefault());

  }

  componentWillUnmount() {
    // 컴포넌트 사라질 때 이벤트 해제 (메모리 누수 방지)
    document.removeEventListener("mousedown", this.handleClickOutside);
      //   document.removeEventListner('contextmenu', event => event.preventDefault());

  }

  handleClickOutside = (event) => {
    // 클릭한 대상이 box, button 내부가 아니라면 닫기
    if (
      this.state.open &&
      this.boxRef.current &&
      !this.boxRef.current.contains(event.target) &&
      this.buttonRef.current &&
      !this.buttonRef.current.contains(event.target)
    ) {
      this.setState({ open: false });
    }
  };

  toggleBox = () => {
    this.setState((prev) => ({ open: !prev.open }));
  };

  render() {
    return (
      <div style={{ position: "relative" }}>
        {/* 버튼 */}
        <button ref={this.buttonRef} onClick={this.toggleBox}>
          열기 / 닫기
        </button>

        {/* 열렸을 때만 표시되는 박스 */}
        {this.state.open && (
          <div
            ref={this.boxRef}
            style={{
              position: "absolute",
              top: "40px",
              left: 0,
              border: "1px solid #333",
              background: "#fff",
              padding: "10px",
              width: "200px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 100
            }}
          >
            버튼 바깥 클릭하면 닫히는 박스!
          </div>
        )}
      </div>
    );
  }
}


export default DropdownBox;

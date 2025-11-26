<img width="950" height="752" alt="image" src="https://github.com/user-attachments/assets/d6861609-0ddb-44d5-a742-58cc2245a250" />

```js
    const renderIflow = (
      <button className="etcBtn newImg" 
          onClick={event => {
            this.props.handleMarkdownPopup(this.richnotification);
          }}
          type="button"
        >
        <img src={`${imageBase}/aiassistant/blog_ico.png`} alt="iflow" />
      </button>
    )
    
```

이거 버튼클릭하면 해당 api처럼 적용되게 해줘. 저 richnotification 메시지를 보낼거야

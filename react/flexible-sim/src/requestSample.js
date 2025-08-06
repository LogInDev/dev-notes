export const EX1 = `{
    "type": "carousel",
    "contents": [
        {
            "type": "bubble",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    { "type": "text", "text": "이벤트 안내", "weight": "bold", "size": "lg" }
                ]
            },
            "hero": {
                "type": "image",
                "url": "https://picsum.photos/400/200",
                "aspectRatio": "16:9"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "md",
                "contents": [
                    { "type": "text", "text": "여름이벤트 시작!", "size": "md", "weight": "bold" },
                    { "type": "text", "text": "지금 참여하고 혜택을 받아가세요.", "size": "sm", "color": "#666" }
                ]
            },
            "footer": {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {
                        "type": "button",
                        "action": { "type": "uri", "label": "자세히 보기", "uri": "https://naver.com" },
                        "style": "primary"
                    },
                    {
                        "type": "button",
                        "action": { "type": "message", "label": "참여하기" },
                        "style": "secondary"
                    }
                ]
            }
        },
        {
            "type": "bubble",
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    { "type": "text", "text": "두 번째 카드", "size": "lg", "weight": "bold" },
                    { "type": "image", "url": "https://picsum.photos/400/201", "aspectRatio": "16:9" }
                ]
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "button",
                        "action": { "type": "uri", "label": "바로가기", "uri": "https://google.com" },
                        "style": "primary"
                    }
                ]
            }
        }
    ]
}`;

export const resevation = `
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "spacing": "md",
    "contents": [
      {
        "type": "text",
        "text": "Meeting Reservation",
        "weight": "bold",
        "size": "xl",
        "align": "center",
        "margin": "md"
      },
      {
        "type": "box",
        "layout": "vertical",
        "margin": "lg",
        "spacing": "sm",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              { "type": "text", "text": "회의명", "color": "#888", "size": "sm", "flex": 2 },
              { "type": "text", "text": "My Data 기반 AI 비서 서비스 프로젝트 디자인 리뷰", "size": "sm", "flex": 5 }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              { "type": "text", "text": "회의실", "color": "#888", "size": "sm", "flex": 2 },
              { "type": "text", "text": "R2 5-6 회의실 (12석)", "size": "sm", "flex": 5 }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              { "type": "text", "text": "예약자", "color": "#888", "size": "sm", "flex": 2 },
              { "type": "text", "text": "X0162468", "size": "sm", "flex": 5 }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              { "type": "text", "text": "예약시간", "color": "#888", "size": "sm", "flex": 2 },
              { "type": "text", "text": "2025-07-30 14:00  ~ 2025-07-30 15:00", "size": "sm", "flex": 5 }
            ]
          }
        ]
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "spacing": "sm",
    "contents": [
      {
        "type": "button",
        "action": {
          "type": "message",
          "label": "회의시작"
        },
        "style": "primary",
        "height": "md"
      },
      {
        "type": "button",
        "action": {
          "type": "message",
          "label": "예약취소"
        },
        "style": "secondary",
        "height": "md"
      }
    ]
  }
}`;

export const imgBot = `{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "Cube AI 챗봇 안내",
        "weight": "bold",
        "size": "xl",
        "align": "center",
        "margin": "md"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/LogInDev/dev-notes/main/react/flexible-sim/src/assets/chatbot.png",
        "size": "xs",
        "aspectRatio": "1:1",
        "margin": "md",
        "borderRadius": "50%",
        "align": "center"
      },
      {
        "type": "text",
        "text": "안녕하세요! Cube AI 챗봇입니다.\\n언제든 문의해주세요.",
        "size": "md",
        "align": "center",
        "color": "#222",
        "margin": "lg"
      }
    ]
  }
}
`
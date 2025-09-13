from dotenv import load_dotenv
import os

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from sympy.physics.units.definitions.dimension_definitions import information

information = """
    일론 리브 머스크 [ a ] (1971년 6월 28일 출생)는 테슬라 , 스페이스X , X(구 트위터) , 그리고 정부효율부 (DOGE) 의 리더십 으로 유명한 국제적인 사업가이자 기업가입니다 . 머스크는 2021년 이후 세계에서 가장 부유한 사람으로 자리매김했습니다 . 2025년 5월 기준 포브스는 그의 순자산을 4,247억 달러 로 추산합니다 .

남아프리카공화국 프리토리아의 부유한 가정 에서 태어난 머스크는 1989년 캐나다로 이주했습니다. 그는 캐나다 출신 어머니를 통해 태어날 때 캐나다 시민권을 취득했습니다. 그는 1997년 미국 필라델피아 에 있는 펜실베이니아 대학교 에서 학사 학위를 받은 후 캘리포니아 로 이주하여 사업을 시작했습니다. 1995년 머스크는 소프트웨어 회사 Zip2를 공동 설립했습니다 . 1999년 회사를 매각한 후에는 온라인 결제 회사인 X.com을 공동 설립했고 , 이후 이 회사와 합병하여 PayPal이 되었으며, PayPal은 2002년 eBay 에 인수되었습니다. 같은 해에 머스크는 미국 시민권도 취득했습니다.

2002년 머스크는 우주 기술 회사 SpaceX를 설립하여 CEO 겸 수석 엔지니어가 되었습니다 . 이 회사는 그 이후로 재사용 가능한 로켓 과 상업용 우주 비행 의 혁신을 주도했습니다 . 머스크는 2004년 자동차 제조업체 Tesla에 초기 투자자로 합류했고 2008년 CEO 겸 제품 설계자가 되었습니다. 그 이후로 전기 자동차 의 선두주자가 되었습니다 . 2015년 그는 인공지능 (AI) 연구를 발전시키기 위해 OpenAI를 공동 설립했지만 나중에 떠났고, 2020년대 AI 붐 에서 조직의 방향과 리더십에 대한 불만이 커지면서 xAI를 설립했습니다 . 2022년 그는 소셜 네트워크 Twitter를 인수하여 상당한 변화를 구현 하고 2023년에 X로 리브랜딩했습니다. 그의 다른 사업으로는 2016년 공동 설립한 신경 기술 회사 Neuralink 와 2017년 설립한 터널링 회사 Boring Company가 있습니다.


"""

if __name__ == "__main__":
    print("Hello LangChain!")

    summary_template = """
        given the information {information} about a person from i want you to create:
        1. a short summary
        2. two interesting facts about them
    """

    # PromptTemplate 객체 생성
    summary_prompt_templete = PromptTemplate(
        input_variables="information", template=summary_template
    )

    # 환경 변수에서 API 키 가져오기 - 1. 직접 가져와서 적용 또는 pycham 실행 시 환경변수로 적용
    # load_dotenv(".env")
    # api_key = os.getenv("OPENAI_API_KEY")
    # llm = ChatOpenAI(temperature=0, model="gpt-4o", api_key=api_key)

    # llm = ChatOllama(model="llama3.2")
    llm = ChatOllama(model="mistral")
    chain = summary_prompt_templete | llm | StrOutputParser()
    res = chain.invoke(input={"information": information})

    print(res)

# Console Result
# 1. ChatOpenAI
    # Hello LangChain!
    # content='
    #   1. 일론 리브 머스크는 국제적으로 유명한 사업가이자 기업가로, 테슬라, 스페이스X, X(구 트위터), 그리고 정부효율부(DOGE)의 리더십으로 알려져 있습니다.
    #   그는 2021년 이후 세계에서 가장 부유한 사람으로 자리매김했으며, 현재 순자산은 4,247억 달러로 추산됩니다.\n\n2.
    #   머스크는 우주 기술 회사인 SpaceX를 설립하여 재사용 가능한 로켓과 상업용 우주 비행의 혁신을 이끌었으며, 전기 자동차 제조업체인 Tesla의 CEO이자 제품 설계자로서 전기 자동차의 선두주자가 되었습니다.'
    # additional_kwargs={'refusal': None}
    # response_metadata={
    #     'token_usage': {
    #         'completion_tokens': 252,
    #         'prompt_tokens': 905,
    #         'total_tokens': 1157,
    #         'completion_tokens_details': {
    #             'accepted_prediction_tokens': 0,
    #             'audio_tokens': 0,
    #             'reasoning_tokens': 0,
    #             'rejected_prediction_tokens': 0
    #         },
    #         'prompt_tokens_details': {'audio_tokens': 0, 'cached_tokens': 0}},
    #         'model_name': 'gpt-3.5-turbo-0125',
    #         'system_fingerprint': None,
    #         'id': 'chatcmpl-CFHGomNNxXVvH6z8pkJ2gG8WUDKK9',
    #         'service_tier': 'default',
    #         'finish_reason': 'stop',
    #         'logprobs': None
    #     }
    # id='run--7986a61f-1850-4e48-8372-0a993873aa3f-0'
    # usage_metadata={
    #     'input_tokens': 905,
    #     'output_tokens': 252,
    #     'total_tokens': 1157,
    #     'input_token_details': {'audio': 0, 'cache_read': 0},
    #     'output_token_details': {'audio': 0, 'reasoning': 0}
    # }

# 2. ChatOllama
    # Hello LangChain!
# content="Here is the information about Elon Musk:\n\n**
#   Summary:**\nElon Musk is a renowned international business magnate and entrepreneur, known for his leadership roles in Tesla, SpaceX, X (formerly Twitter),
#       and Dogecoin. He has become one of the richest people in the world since 2021, with an estimated net worth of $4.247 billion as of May 2025.\n\n
#       **Interesting Facts:**\n\n1. **From South Africa to Global Success:** Elon Musk was born in Pretoria, South Africa, and moved to Canada at the age of 17.
#       He later became a U.S. citizen in 2002.\n2. **Pioneering Space Exploration:** In 2002, Musk founded SpaceX,
#       which has revolutionized space technology with its reusable rockets and commercial spaceflight services.
#       His ambitious goal is to make humanity a multiplanetary species.\n\nLet me know if you'd like me to add anything else!"
#  additional_kwargs={}
#  response_metadata={
#       'model': 'llama3.2',
#       'created_at': '2025-09-13T10:22:41.027606Z',
#       'done': True, 'done_reason': 'stop', 'total_duration': 2787052042,
#       'load_duration': 485933292, 'prompt_eval_count': 611,
#       'prompt_eval_duration': 468773167, 'eval_count': 190,
#       'eval_duration': 1831905333, 'model_name': 'llama3.2'
#  }
#  id='run--997933c2-4873-4b89-8d23-b1ab073b5045-0'
#  usage_metadata={'input_tokens': 611, 'output_tokens': 190, 'total_tokens': 801}
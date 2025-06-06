# 테스트 코드는 문서다.
## 문서?
- 프로덕션 기능을 설명하는 테스트 코드 문서
- 테스트는 제품 코드의 '어떻게' 동작하는지를 다양
- 다양한 테스트 케이스를 통해 프로덕션 코드를 이해하는 시각과 관점을 보완
- 어느 한 사람이 과거에 경험했던 고민의 결과물을 팀 차원으로 승격시켜서, 모두의 자산으로 공유할 수 있다.

### "우리는 항상 팀으로 일한다."

## DisplayName을 섬세하게
- `Setting` - `Build Tools` - `Gradle` - `Run test using`에 항목을 
`IntelliJ`로 변경하면 설정한 `@DisplayName`으로 테스결과가 나옴.
- 명사의 나열보다 문장으로 작성하는 것을 지향
  - "~테스트" 식 작성 지양하기 
  - "음료 1개 추가 테스트"보다는 "음료를 1개 추가할 수 있다" 식으로 작성
- 테스트 행위에 대한 결과까지 기술하기
  - "음료를 1개 추가할 수 있다" 보다는 "음료를 1개 추가하면 주문 목록에 담긴다."
- **도메인 용어를 사용**하여 한층 추상화된 내용을 담기<br />
→ 메서드 자체의 관점보다 도메인 정책 관점으로<br />
→ 테스트의 현상을 중점으로 기술하지 말 것 - "~성공한다", "~실패한다"보다는 "~주문한다"등의 도메인 용어 사용
    - "특정 시간 이전에 주문을 생성하면 실패한다" 보다는 <br /> 
  "**영업 시작 시간** 이전에는 주문을 생성할 수 없다." 식으로 작성 

# BDD, Behavior Driven Development
- TDD에서 파생된 개발 방법
- 함수 단위의 테스트에 집중하기보다, 시나리오에 기반한 테스트케이스(TC) 자체에 집중하여 테스트한다.
- 개발자가 아닌 사람이 봐도 이해할 수 있을 정도의 추상화 수준(레벨)을 권장

## Given / When / Then
- Given : 시나리오 진행에 필요한 모든 준비 과정(객체, 값, 상태 등)
- When : 시나리오 행동 진행
- Then : 시나리오 진행에 대한 겨로가 명시, 검증
> " 어떤 환경에서(Given)<br />
> &nbsp;&nbsp; 어떤 행동을 진행했을 때(When)<br />
> &nbsp;&nbsp; 어떤 상태 변화가 일어난다(Then)"<br />
> → 이걸 작성함으로써 DisplayName에 명확하게 작성할 수 있다.

### given-when-then이 포함된 Test 템플릿 만들기
- `Setting` - `Editor` - `Live Templates` - `java`에서 추가(경로까지 추가해야 추가됨.)

    ```java
    @org.junit.jupiter.api.DisplayNmae("")
    @org.junit.jupiter.api.Test
    void test(){
    // given

    // when

    // then
    }
    ```
  
# 추가 공부
## JUnit vs Spock
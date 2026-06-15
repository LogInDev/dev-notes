// 1
const [searchParams] = useSearchParams();
// boolean으로 안전하게 캐스팅
const isReqScroll = searchParams.get('isScroll') === 'true'; 

useEffect(() => {
  if (
    isReqScroll &&
    fetchServiceDetailSuccess &&
    buttonRef.current &&
    scrollRef.current
  ) {
    // 1. 스크롤 이동 실행
    scrollToPosition(scrollRef, buttonRef, 500);

    // 2. 파라미터 지우기 로직 (1회성 처리)
    searchParams.delete('isScroll'); // isScroll 파라미터만 제거
    
    // 3. 브라우저 히스토리를 덮어써서 파라미터가 지워진 URL로 변경 (새로고침 발생 안 함)
    navigate(`${location.pathname}?${searchParams.toString()}`, { 
      replace: true 
    });
  }
}, [fetchServiceDetailSuccess, isReqScroll, navigate, location.pathname, searchParams]);


// state
// 잘못된 예 (state가 null로 뜸)
navigate(`/api/detail/${id}`, { isReqScroll: true }); 

// 올바른 예 (반드시 state 객체로 한 번 더 감싸야 함)
navigate(`/api/detail/${id}`, { state: { isReqScroll: true } });


const location = useLocation();
const { isReqScroll } = location.state || {};

useEffect(() => {
  if (
    isReqScroll &&
    fetchServiceDetailSuccess &&
    buttonRef.current &&
    scrollRef.current
  ) {
    // 1. 스크롤 이동 실행
    scrollToPosition(scrollRef, buttonRef, 500);

    // 2. state 객체를 비우면서 현재 경로로 덮어쓰기 (1회성 처리)
    // 주석 처리하셨던 코드와 동일한 원리입니다!
    navigate(location.pathname, {
      replace: true,
      state: null, // 명시적으로 state를 날려버림
    });
  }
}, [fetchServiceDetailSuccess, isReqScroll, navigate, location.pathname]);

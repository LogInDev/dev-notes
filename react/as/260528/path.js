// RoutesPath.js 추천 구조
<Routes>
  {/* 기본 주소 진입 시 /api/list로 리다이렉트 */}
  <Route path={`${getRoutePath(basename, '')}`} element={<Navigate replace to={getRoutePath(basename, '/api/list')} />} />
  <Route path={`${getRoutePath(basename, '/')}`} element={<Navigate replace to={getRoutePath(basename, '/api/list')} />} />

  {/* 동적 파라미터 :svcType 적용 */}
  <Route path={`${getRoutePath(basename, '/:svcType/list')}`} element={<ApiList />} />
  <Route path={`${getRoutePath(basename, '/:svcType/regist')}`} element={<ApiRegist />} />
  <Route path={`${getRoutePath(basename, '/:svcType/detail/:svcId')}`} element={<ApiDetail />} />
  <Route path={`${getRoutePath(basename, '/:svcType/update/:svcId')}`} element={<ApiUpdate />} />
  
  {/* 기타 공통 메뉴 */}
  <Route path={`${getRoutePath(basename, '/my/keys')}`} element={<ApiKey />} />
  <Route path="*" element={<NoMatch />} />
</Routes>

//-------------------------------------------------------------------------------------------------------------------------------------

import { useParams, useNavigate } from 'react-router-dom';

const ApiList = () => {
  // 🌟 URL에서 현재 svcType('api', 'mcp', 'gaia')을 바로 가져옵니다.
  const { svcType } = useParams(); 
  const basename = useContext(BasenameContext);
  const navigate = useNavigate();

  // 기존에 있던 useEffect (location 파싱해서 Redux set하는 로직) 전체 제거 가능!
  
  // 서비스 목록 조회 호출 시 svcType 전달
  useEffect(() => {
    if (!fetchSelectedKeyIdLoading) {
      getServiceList({
        keyword: searchedTerm,
        sortBy,
        category: selectedCategories.join(','),
        keyId: selectedKey?.keyId,
        svcType: svcType, // 🌟 API 호출할 때 파라미터로 바로 꽂아줍니다.
      });
    }
  }, [svcType, searchedTerm, sortBy, selectedCategories, selectedKey]);

  // 등록 화면 이동 시에도 현재 타입 유지
  const handleNavigateToRegist = () => {
    navigate(`${getRoutePath(basename, `/${svcType}/regist`)}`);
  };

}

//-------------------------------------------------------------------------------------------------------------------------------------

const axiosGetServiceList = async (keyword, sortBy, category, keyId, svcType) => { // svcType 인자 추가
  const response = await axios.get(`${process.env.VITE_REACT_APP_API_STORE_URL}/service/list`, {
    params: { keyword, sortBy, category, keyId, svcType, order: 'desc' } // params에 추가!
  });
  return response;
};

//-------------------------------------------------------------------------------------------------------------------------------------


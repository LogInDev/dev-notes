import { useContext, useEffect } from 'react';
import { Route, Routes, Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { fetchCategory } from '@/store/reduxStore/category/reducer';
import { fetchKey, updateField } from '@/store/reduxStore/keySelect/reducer';
import { fetchIsAdmin } from '@/store/reduxStore/permission/reducer';
import { getRoutePath } from '@/utils/Str.js';
import { BasenameContext } from '@/utils/Context.js';
import { intlObj, lang } from '@/utils/commonUtils';
import ToastProvider from '@/utils/ToastProvider';
import ApiList from '@/pages/ApiList';
import ApiRegist from '@/pages/ApiRegist';
import ApiUpdate from '@/pages/ApiUpdate';
import ApiDetail from '@/pages/ApiDetail';
import Admin from '@/pages/Admin';
import AdminDashboard from '@/pages/AdminDashboard';
import ApiKey from '@/pages/ApiKey';
import CtsUpload from '@/pages/Ctsupload';
import Dashboard from '@/pages/Dashboard';
import DashDetail from '@/pages/Dashboard/detail';

function NoMatch() {
  const basename = useContext(BasenameContext);
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to={`${getRoutePath(basename, '/api/list')}`}>
          Go to the home page
        </Link>
      </p>
    </div>
  );
}

/**
 * Application 내 Route 기능을 담당하는 Class 입니다.
 *
 * @class
 */
const RoutesPath = (props) => {
  const { wpstate } = props;
  const { basename, appInfo, profile } = wpstate;

  const dispatch = useDispatch();

  const keyState = useSelector((state) => state.get('keySelect')) || {};
  const keyList = keyState?.keyList || [];
  const fetchKeySuccess = keyState?.fetchSuccess || false;

  useEffect(() => {
    dispatch(fetchCategory());
    dispatch(fetchKey());
    dispatch(fetchIsAdmin());
  }, []);

  useEffect(() => {
    if (fetchKeySuccess) {
      if (keyList.length > 0) {
        let selectedKeyId = localStorage.getItem('apiStoreKey');
        // 정수로 변환
        if (typeof selectedKeyId === 'string')
          selectedKeyId = selectedKeyId * 1;

        // 전에 선택한 키가 현재 존재하지 않을 경우 가장 최근 만들어진 키로 설정
        const existKey =
          selectedKeyId && keyList.some((key) => key.keyId === selectedKeyId);
        if (!existKey) {
          selectedKeyId = keyList[0].keyId;
        }
        localStorage.setItem('apiStoreKey', selectedKeyId);
        dispatch(
          updateField({
            field: `selectedKeyId`,
            value: selectedKeyId === null ? undefined : selectedKeyId,
          }),
        );
      } else {
        localStorage.removeItem('apiStoreKey');
        dispatch(updateField({ field: `selectedKeyId`, value: undefined }));
      }
    }
  }, [fetchKeySuccess, keyList]);

  /**
   *
   *  다국어 관련 초기 세팅 코드입니다.
   *  중국어 및 영어 테스트 시 다음 아래의 예시처럼 바꾼 후 테스트 해보시면 됩니다.
   *
   *  lang.setLang('KOR') => lang.setLang('CHN')
   *  en: 'ENG', ko: 'KOR', zh: 'CHN',
   *
   *  자세한 내용은 다음 url 참고 바랍니다.
   *  http://iflow.skhynix.com/group/article/4491683
   */
  const intl = useIntl();
  intlObj.setIntl(intl);
  lang.setLang('KOR');

  /**
   *  HCP 서버 및 로컬서버에서 동일하게 작동하기 위해서
   *  Route 시 다음과 같이 path={`${getRoutePath(basename, '')}`}
   *  getRoutePath 함수를 이용하시길 바랍니다.
   *
   */
  return (
    <ToastProvider>
      <Routes>
        <Route
          path={`${getRoutePath(basename, '')}`}
          element={
            <Navigate replace to={getRoutePath(basename, '/api/list')} />
          }
        />
        <Route
          path={`${getRoutePath(basename, '/')}`}
          element={
            <Navigate replace to={getRoutePath(basename, '/api/list')} />
          }
        />
        <Route
          path={`${getRoutePath(basename, '/api/list')}`}
          element={<ApiList />}
        />
        <Route
          path={`${getRoutePath(basename, '/api/regist')}`}
          element={<ApiRegist />}
        />
        <Route
          path={`${getRoutePath(basename, '/api/detail/:svcId')}`}
          element={<ApiDetail />}
        />
        <Route
          path={`${getRoutePath(basename, '/api/update/:svcId')}`}
          element={<ApiUpdate />}
        />
        <Route
          path={`${getRoutePath(basename, '/my/keys')}`}
          element={<ApiKey />}
        />
        <Route
          path={`${getRoutePath(basename, '/admin')}`}
          element={<Admin />}
        />
        <Route
          path={`${getRoutePath(basename, '/admin/dashboard')}`}
          element={<AdminDashboard />}
        />
        <Route
          path={`${getRoutePath(basename, '/dashboard')}`}
          element={<Dashboard />}
        />
        <Route
          path={`${getRoutePath(basename, '/dashboard/detail/:svcId')}`}
          element={<DashDetail />}
        />
        <Route
          path={`${getRoutePath(basename, '/cts/upload')}`}
          element={<CtsUpload />}
        />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </ToastProvider>
  );
};
export default RoutesPath;

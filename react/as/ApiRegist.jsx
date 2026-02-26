import { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { Spin } from 'signlw';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@/utils/ToastProvider';
import { initState, registApi } from '@/store/reduxStore/regist/reducer';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '@/utils/Str';
import { scrollToPosition } from '@/utils/scrollUtils';
import { BasenameContext } from '@/utils/Context';
import { findFirstFalsePosition } from '@/utils/commonUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import PageLayout from '@/components/Organisms/PageLayout';
import Steps from '@/components/Organisms/Steps';
import Buttons from '@/components/Atoms/Buttons';
import Division from '@/components/Atoms/Division';
import Base from './base';
import Detail from './detail';
import Permission from './permission';
import Header from '@/components/Templates/Header';
import Confirm from '@/components/Atoms/Confirm';

/* Step 아이콘 모음 */
import baseStepIcon from '@/assets/images/common/icon_step01.svg';
import detailStepIcon from '@/assets/images/common/icon_step02.svg';
import permissionStepIcon from '@/assets/images/common/icon_step03.svg';

const defaultConfirm = {
  open: false,
  title: '',
  desc: '',
  okText: '',
  cancelText: '',
  onOk: () => {},
  onCancel: () => {},
};

const ApiRegist = () => {
  const errorMessageByStep = [
    [intlObj.get(message['store.validation.registBaseInfo'])],
    [intlObj.get(message['store.validation.registApiDetailInfo'])],
    [
      intlObj.get(message['store.validation.registPermissionInfo.manager']),
      intlObj.get(message['store.validation.registPermissionInfo.project']),
    ],
  ];

  const { addToast, deleteToast } = useToast();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

  const scrollRef = useRef(null);
  const baseRef = useRef(null);
  const detailRef = useRef(null);
  const permissionRef = useRef(null);
  const refs = [baseRef, detailRef, permissionRef];

  const categoryState = useSelector((state) => state.get('category')) || [];
  const categoryLoading = categoryState?.fetchCategoryListLoading || false;

  const registState = useSelector((state) => state.get('regist'))?.form || {};
  const isValidBase = registState?.base?.isValid;
  const isValidDetail = registState?.detail?.isValid;
  const isValidManager = registState?.permission?.isValidManager;
  const isValidProject = registState?.permission?.isValidProject;
  const isValidByStep = [
    [isValidBase],
    [isValidDetail],
    [isValidManager, isValidProject],
  ];
  const modelListLoading = registState?.base?.fetchModelListLoading || false;
  const initLoading = categoryLoading || modelListLoading; // 페이지 로드 시 로딩
  const registLoading = registState?.registLoading || false; // 등록 시 로딩
  const registSuccess = registState?.registSuccess || false;
  const registFail = registState?.registFail || false;

  const [step, setStep] = useState(0);
  const [isScroll, setIsScroll] = useState(false);
  const [startBaseValidation, setStartBaseValidation] = useState(false); // 기본 정보 등록에서 비활성 상태인 다음 버튼 누를 시 validation 시작
  const [startDetailValidation, setStartDetailValidation] = useState(false); // 상세 정보 등록에서 비활성 상태인 다음 버튼 누를 시 validation 시작
  const [confirm, setConfirm] = useState(defaultConfirm);

  // 다음 Step 으로 넘어가기 위한 Validation 검사 여부
  const isValidCurrentStep = useMemo(() => {
    const errorIndex = findFirstFalsePosition(isValidByStep.slice(0, step + 1));
    if (errorIndex === undefined) {
      return true;
    }
    return false;
  }, [isValidByStep, step]);

  useEffect(() => {
    return () => {
      dispatch(initState());
    };
  }, []);

  useEffect(() => {
    if (registSuccess) {
      deleteToast('registLoading');
      addToast(intlObj.get(message['store.success.registApi']), 'success');
      dispatch(initState());
      navigateToList();
    }
  }, [registSuccess, intlObj, message]);

  useEffect(() => {
    if (registFail) {
      deleteToast('registLoading');
      addToast(intlObj.get(message['store.error.registApi']), 'error');
    }
  }, [registFail, intlObj, message]);

  // 목록 페이지로 이동
  const navigateToList = () => {
    navigate(`${getRoutePath(basename, '/api/list')}`);
  };

  // 스크롤 여부 확인을 위한 메소드
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    if (scrollTop === 0) {
      setIsScroll(false);
    } else {
      setIsScroll(true);
    }
  };

  // 단계 이동 핸들링 (해당 함수 내의 step 의 최댓값은 1)
  const handleClickNextStep = () => {
    setStartBaseValidation(true);
    if (step > 0) {
      setStartDetailValidation(true);
    }
    const errorIndex = findFirstFalsePosition(isValidByStep.slice(0, step + 1));
    if (errorIndex !== undefined) {
      const errorMessage = errorMessageByStep[errorIndex[0]][errorIndex[1]];
      addToast(errorMessage, 'error');
      scrollToPosition(scrollRef, refs[errorIndex[0]], 500);
    } else {
      setStep(step + 1);
      setTimeout(() => {
        scrollToPosition(scrollRef, refs[step + 1], 500);
      }, 100);
    }
  };

  // 등록 핸들링
  const handleRequestReview = () => {
    const errorIndex = findFirstFalsePosition(isValidByStep);
    if (errorIndex !== undefined) {
      setStartBaseValidation(true);
      setStartDetailValidation(true);
      handleCloseConfirm();
      const errorMessage = errorMessageByStep[errorIndex[0]][errorIndex[1]];
      addToast(errorMessage, 'error');
      scrollToPosition(scrollRef, refs[errorIndex[0]], 500);
    } else {
      addToast(
        intlObj.get(message['store.loading.saving']),
        'loading',
        0,
        'registLoading',
      );
      handleCloseConfirm();
      dispatch(registApi(registState));
    }
  };

  // 컨펌 창 닫기 핸들링
  const handleCloseConfirm = () => {
    setConfirm(defaultConfirm);
  };

  // 목록 이동 (등록 취소) 컨펌창 오픈 핸들링
  const handleOpenCancelConfirm = () => {
    setConfirm({
      open: true,
      title: intlObj.get(message['store.ok']),
      desc: intlObj.get(message['store.confirm.cancelRegistApi']),
      okText: intlObj.get(message['store.ok']),
      cancelText: intlObj.get(message['store.cancel']),
      onOk: navigateToList,
      onCancel: handleCloseConfirm,
    });
  };

  // 등록 컨펌창 오픈 핸들링
  const handleOpenRegistConfirm = () => {
    setConfirm({
      open: true,
      title: intlObj.get(message['store.registApi']),
      desc: intlObj.get(message['store.confirm.registApi']),
      okText: intlObj.get(message['store.ok']),
      cancelText: intlObj.get(message['store.cancel']),
      onOk: handleRequestReview,
      onCancel: handleCloseConfirm,
    });
  };

  const stepMenus = [
    {
      title: intlObj.get(message['store.baseInfo']),
      onClick: () => scrollToPosition(scrollRef, refs[0], 500),
      icon: baseStepIcon,
    },
    {
      title: intlObj.get(message['store.registApiDetailInfo']),
      onClick: () => scrollToPosition(scrollRef, refs[1], 500),
      icon: detailStepIcon,
    },
    {
      title: intlObj.get(message['store.registPermissionInfo']),
      onClick: () => scrollToPosition(scrollRef, refs[2], 500),
      icon: permissionStepIcon,
    },
  ];

  return (
    <PageLayout>
      <Header
        path={[
          intlObj.get(message['store']),
          intlObj.get(message['store.registApi']),
        ]}
      />
      <Steps
        step={step}
        data={stepMenus}
        isScroll={step > 0 ? isScroll : false}
      />
      <PageLayout.Article onScroll={handleScroll} ref={scrollRef}>
        <Spin spinning={initLoading || registLoading}>
          <Base ref={baseRef} startValidation={startBaseValidation} />
          {step > 0 && (
            <Detail ref={detailRef} startValidation={startDetailValidation} />
          )}
          {step > 1 && <Permission ref={permissionRef} />}
          <Division flex={true} gap={10} justifyContent={'center'}>
            <Buttons.Basic type={'line'} onClick={handleOpenCancelConfirm}>
              {intlObj.get(message['store.list'])}
            </Buttons.Basic>
            {step < 2 ? (
              <Buttons.Basic
                type={`${!isValidCurrentStep ? 'grey' : 'primary'}`}
                onClick={handleClickNextStep}
              >
                {intlObj.get(message['store.next'])}
              </Buttons.Basic>
            ) : (
              registFail !== true && (
                <Buttons.Basic
                  type={'primary'}
                  onClick={handleOpenRegistConfirm}
                >
                  {intlObj.get(message['store.regist'])}
                </Buttons.Basic>
              )
            )}
          </Division>
        </Spin>
        <Confirm
          open={confirm.open}
          title={confirm.title}
          desc={confirm.desc}
          onOk={confirm.onOk}
          onCancel={confirm.onCancel}
          okText={confirm.okText}
          cancelText={confirm.cancelText}
        />
      </PageLayout.Article>
    </PageLayout>
  );
};

export default ApiRegist;

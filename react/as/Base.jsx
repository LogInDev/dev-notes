import { useState, useEffect, useMemo, forwardRef, Fragment } from 'react';
import { Col, Row } from 'signlw';
import { produce } from 'immer';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@/utils/ToastProvider';
import {
  fetchModelList,
  fetchProxyList,
  updateField,
} from '@/store/reduxStore/regist/reducer';
import { processCategoryForTree } from '@/utils/categoryUtils';
import { isValidUrl } from '@/utils/urlUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import Divide from '@/components/Atoms/Divide';
import Select from '@/components/Atoms/Select';
import Division from '@/components/Atoms/Division';
import Confirm from '@/components/Atoms/Confirm';
import ContentHeader from '@/components/Organisms/ContentHeader';
import CategoryModal from '@/components/Organisms/CategoryModal';
import Form from '@/components/Organisms/RegistForm';

const basePath = ['form', 'base'];

const serviceTypes = [
  { label: 'API', value: 'API' },
  { label: 'LLM', value: 'LLM' },
  { label: 'DRM', value: 'DRM' },
];

const defaultDeleteConfirm = {
  open: false,
  deletedId: null,
};

function findNodeByKey(tree, key) {
  for (let node of tree) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const result = findNodeByKey(node.children, key);
      if (result) {
        return result;
      }
    }
  }
}

const Base = forwardRef(({ startValidation }, ref) => {
  const documentTypes = [
    {
      label: intlObj.get(message['store.select']),
      value: '',
      placeholder: intlObj.get(
        message['store.placeholder.select.apiServiceDocumentUrl'],
      ),
    },
    {
      label: 'FAQ',
      value: 'FAQ',
      placeholder: intlObj.get(
        message['store.placeholder.input.apiServiceDocumentUrl.faq'],
      ),
    },
    {
      label: intlObj.get(message['store.iflow']),
      value: 'IFW',
      placeholder: intlObj.get(
        message['store.placeholder.input.apiServiceDocumentUrl.iflow'],
      ),
    },
    {
      label: intlObj.get(message['store.directInput']),
      value: 'ETC',
      placeholder: [
        intlObj.get(
          message['store.placeholder.input.apiServiceDocumentUrl.etcName'],
        ),
        intlObj.get(
          message['store.placeholder.input.apiServiceDocumentUrl.etc'],
        ),
      ],
    },
  ];

  const { addToast } = useToast();

  const dispatch = useDispatch();

  const categoryState = useSelector((state) => state.get('category')) || {};
  const categories = categoryState?.categoryList || [];
  const categoryLanguage = categoryState?.language;

  const baseState =
    useSelector((state) => state.get('regist'))?.form?.base || {};
  const serviceName = baseState?.serviceName || '';
  const serviceDesc = baseState?.serviceDesc || '';
  const selectedCategories = baseState?.selectedCategories || [];
  const serviceType = baseState?.serviceType || 'API';
  const proxyList = baseState?.proxyList || [];
  const proxy = baseState?.proxy || null;
  const modelList = baseState?.modelList || [];
  const model = baseState?.model || null;
  const documents = baseState?.documents || [];

  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] =
    useState(defaultDeleteConfirm);

  useEffect(() => {
    if (serviceType === 'LLM') {
      dispatch(fetchProxyList());
      dispatch(fetchModelList());
    }
  }, [serviceType]);

  const categoryTree = useMemo(
    () =>
      produce(categories, (draft) =>
        processCategoryForTree(draft, categoryLanguage),
      ),
    [categories, categoryLanguage],
  );
  const selectedCategoryName = useMemo(
    () =>
      selectedCategories[0]
        ? categoryLanguage?.[
            findNodeByKey(categoryTree, selectedCategories[0])?.catId
          ] || ''
        : '',
    [categoryTree, selectedCategories, categoryLanguage],
  );

  // documents validation
  const documentValidation = () => {
    if (documents.length === 1) {
      // 폼 입력 행만 있을 때
      const doc = documents[0];
      if (doc.type !== '' && (!isValidUrl(doc.url) || doc.url.trim() === '')) {
        return false;
      } else if (doc.type === '' && doc.url.trim() !== '') {
        return false;
      } else if (doc.type === 'ETC' && doc.urlName.trim() === '') {
        return false;
      }
    }
    if (
      documents.length > 1 &&
      documents.some(
        (doc) =>
          doc.type === '' ||
          doc.url.trim() === '' ||
          !isValidUrl(doc.url) ||
          (doc.type === 'ETC' && doc.urlName.trim() === ''),
      )
    ) {
      return false;
    }
    return true;
  };

  const isValid = useMemo(() => {
    if (serviceName.trim() === '') {
      return false;
    }
    if (serviceDesc.trim() === '') {
      return false;
    }
    if (selectedCategories.length < 1) {
      return false;
    }
    if (serviceType === 'LLM' && (proxy === null || model === null)) {
      return false;
    }

    return documentValidation();
  }, [baseState]);

  useEffect(() => {
    dispatch(updateField({ field: [...basePath, 'isValid'], value: isValid }));
  }, [isValid]);

  const handleUpdateBaseState = (field, updatedData) => {
    dispatch(updateField({ field: [...basePath, field], value: updatedData }));
  };

  const handleChangeServiceType = (updatedType) => {
    if (updatedType !== 'LLM') {
      handleUpdateBaseState('model', null);
      handleUpdateBaseState('proxy', null);
      handleUpdateBaseState('server', '');
    }

    // TODO: proxy 및 server 값 하드코딩. 추후 제거
    if (updatedType === 'LLM') {
      const environment = process.env.VITE_APP_ENV;
      handleUpdateBaseState('proxy', 'common');
      handleUpdateBaseState(
        'server',
        environment === 'development'
          ? 'http://hcp-arch-llm-proxy-basic-dev.api.aipp01.skhynix.com'
          : environment === 'staging'
            ? 'http://hcp-arch-llm-proxy-basic-stg.api.aipp01.skhynix.com'
            : environment === 'production'
              ? 'http://hcp-arch-llm-proxy-basic-prd.api.aipp01.skhynix.com'
              : 'http://hcp-arch-llm-proxy-basic-dev.api.aipp01.skhynix.com',
      );
    }

    handleUpdateBaseState('serviceType', updatedType);
  };

  const handleClickAddDocument = (newDocument) => {
    if (documents?.length > 6) {
      addToast(intlObj.get(message['store.warning.maxSetIs7']), 'warning');
    } else {
      const nextData = produce(documents, (draft) => {
        draft.splice(1, 0, newDocument);
      });
      handleUpdateBaseState('documents', nextData);
    }
  };

  const handleClickRemoveDocument = () => {
    const deletedId = openDeleteConfirm.deletedId;
    const nextData = produce(documents, (draft) =>
      draft.filter((item) => item.id !== deletedId),
    );
    handleUpdateBaseState('documents', nextData);
    setOpenDeleteConfirm(defaultDeleteConfirm);
  };

  const handleUpdateDocument = (updatedData) => {
    const targetId = updatedData.id;
    const nextData = produce(documents, (draft) => {
      const targetIndex =
        targetId === 'form'
          ? '0'
          : draft.findIndex((item) => item.id === targetId);
      if (targetIndex !== -1) {
        draft[targetIndex] = updatedData;
      }
      return draft;
    });
    handleUpdateBaseState('documents', nextData);
  };

  return (
    <div ref={ref}>
      <ContentHeader
        title={intlObj.get(message['store.registBaseInfo'])}
        $border
        spacing={20}
      />
      <Row gutter={[8, 0]}>
        <Col span={12}>
          <Form.Label
            label={intlObj.get(message['store.apiServiceName'])}
            required
          />
          <Form.Input
            keyword={serviceName}
            onChange={(e) =>
              handleUpdateBaseState('serviceName', e.target.value)
            }
            placeholder={intlObj.get(
              message['store.placeholder.input.apiName'],
            )}
            validation={startValidation}
            maxLength={50}
            showCount={true}
          />
        </Col>
        <Col span={12}>
          <Form.Label label={intlObj.get(message['store.category'])} required />
          <Form.Search
            keyword={selectedCategoryName}
            onClick={() => setOpenCategoryModal(true)}
            placeholder={intlObj.get(
              message['store.placeholder.select.atPopup'],
            )}
            validation={startValidation}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Form.Label label={intlObj.get(message['store.apiDesc'])} required />
          <Form.TextArea
            keyword={serviceDesc}
            onChange={(e) =>
              handleUpdateBaseState('serviceDesc', e.target.value)
            }
            placeholder={intlObj.get(
              message['store.placeholder.input.apiDesc'],
            )}
            validation={startValidation}
            maxLength={1000}
            showCount={true}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Form.Label
            label={intlObj.get(message['store.apiServiceType'])}
            required
          />
          <Division flex={true} gap={8} mb={20}>
            <Select
              width={'100%'}
              maxWidth={200}
              options={serviceTypes}
              value={serviceType}
              onChange={(value) => handleChangeServiceType(value)}
            />
            {serviceType === 'LLM' && (
              <>
                <Select
                  width={'100%'}
                  options={proxyList}
                  value={proxy}
                  fieldNames={{ label: 'proxyName', value: 'proxyUrl' }}
                  placeholder={intlObj.get(
                    message['store.placeholder.select.proxy'],
                  )}
                  onChange={(value, option) => {
                    handleUpdateBaseState('proxy', option?.proxyName);
                    handleUpdateBaseState('server', value);
                  }}
                  validation={startValidation}
                />
                {proxy !== null && (
                  <Select
                    width={'100%'}
                    options={modelList}
                    value={model}
                    fieldNames={{ label: 'modelPath', value: 'modelPath' }}
                    placeholder={intlObj.get(
                      message['store.placeholder.select.model'],
                    )}
                    onChange={(value) => handleUpdateBaseState('model', value)}
                    validation={startValidation}
                  />
                )}
              </>
            )}
          </Division>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Form.Label
            label={intlObj.get(message['store.apiServiceDocumentUrl'])}
          />
          <Form.SelectInput
            options={documentTypes}
            onClickButton={(data) => handleClickAddDocument(data)}
            type={'add'}
            data={documents[0]}
            onChangeData={(data) => handleUpdateDocument(data)}
            validation={!documentValidation()}
            showError={!documentValidation() && !isValidUrl(documents[0]?.url)}
            errorMessage={intlObj.get(message['store.validation.url'])}
            defaultPlaceholder={intlObj.get(
              message['store.placeholder.select.apiServiceDocumentUrl'],
            )}
            nameMaxLength={10}
            maxLength={100}
            showCount={true}
          />
          {documents?.map(
            (value, index) =>
              value.id !== 'form' && (
                <Fragment key={index.toString()}>
                  <Divide top={0} bottom={10} />
                  <Form.SelectInput
                    options={documentTypes}
                    data={value}
                    onChangeData={(data) => handleUpdateDocument(data)}
                    validation={!documentValidation()}
                    showError={!documentValidation() && !isValidUrl(value?.url)}
                    errorMessage={intlObj.get(message['store.validation.url'])}
                    onClickButton={(deletedId) =>
                      setOpenDeleteConfirm({ open: true, deletedId })
                    }
                    defaultPlaceholder={
                      documentTypes.find((type) => type.value === value.type)
                        ?.placeholder || undefined
                    }
                    nameMaxLength={10}
                    maxLength={100}
                    showCount={true}
                  />
                </Fragment>
              ),
          )}
        </Col>
      </Row>
      <Divide top={20} bottom={0} $border={false} />
      <CategoryModal
        open={openCategoryModal}
        treeData={categoryTree}
        selectedData={selectedCategories}
        onOk={(selectedKeys) => {
          handleUpdateBaseState('selectedCategories', selectedKeys);
          setOpenCategoryModal(false);
        }}
        onCancel={() => {
          setOpenCategoryModal(false);
        }}
        type={'radio'}
      />
      <Confirm
        open={openDeleteConfirm.open}
        title={intlObj.get(message['store.delete'])}
        desc={intlObj.get(message['store.confirm.delete'])}
        okText={intlObj.get(message['store.delete'])}
        cancelText={intlObj.get(message['store.cancel'])}
        onOk={() => handleClickRemoveDocument()}
        onCancel={() => setOpenDeleteConfirm(defaultDeleteConfirm)}
      />
    </div>
  );
});

export default Base;

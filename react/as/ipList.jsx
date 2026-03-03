import { useState, useMemo, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '@/store/reduxStore/regist/reducer';
import { useToast } from '@/utils/ToastProvider';
import { produce } from 'immer';
import { extractPathParameters, isValidApiPath } from '@/utils/urlUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import Buttons from '@/components/Atoms/Buttons';
import Input from '@/components/Atoms/Input';
import Select from '@/components/Atoms/Select';
import Method from '@/components/Atoms/Method';
import Division from '@/components/Atoms/Division';
import Confirm from '@/components/Atoms/Confirm';
import Ellipsis from '@/components/Atoms/Ellipsis';
import Dropdown from '@/components/Atoms/Dropdown';
import FormRow from '@/components/Atoms/FormRow';
import FormCol from '@/components/Atoms/FormCol';
import CollapseTable from '@/components/Organisms/CollapseTable';
import ParameterForm from '@/components/Organisms/ParameterForm';
import ParameterList from '@/components/Organisms/ParameterList';
import BodyForm from '@/components/Organisms/BodyForm';
import QosForm from '@/components/Organisms/QosForm';

const methodOptions = [
  { label: 'GET', value: 'get' },
  { label: 'POST', value: 'post' },
  { label: 'PUT', value: 'put' },
  { label: 'DELETE', value: 'delete' },
  { label: 'OPTION', value: 'option' },
  { label: 'HEAD', value: 'head' },
];
const defaultPageSize = 10;
const defaultApiForm = {
  id: '',
  path: '',
  method: 'get',
  qosList: [
    {
      term: 86400,
      limitCnt: -99999,
      qosType: 'CALL',
    },
  ],
  showYn: 'Y',
  info: {
    parameters: [],
  },
};
const defaultDeleteConfirm = {
  open: false,
  targetId: undefined, // 삭제할 요소의 ID
};

const IpList = () => {
  const showYnOptions = [
    { label: intlObj.get(message['store.showY']), value: 'Y' },
    { label: intlObj.get(message['store.showN']), value: 'N' },
  ];
  const pageSizeOptions = [
    { label: intlObj.get(message['store.pageSize10']), value: 10 },
    { label: intlObj.get(message['store.pageSize30']), value: 30 },
    { label: intlObj.get(message['store.pageSize50']), value: 50 },
    { label: intlObj.get(message['store.pageSize100']), value: 100 },
  ];

  const { addToast } = useToast();

  const dispatch = useDispatch();

  const baseState =
    useSelector((state) => state.get('regist'))?.form?.base || {};
  const serviceType = baseState?.serviceType || 'API';
  const detailState =
    useSelector((state) => state.get('regist'))?.form?.detail || {};
  const apiList = detailState?.apiList || [];

  const [apiRegistForm, setApiRegistForm] = useState(defaultApiForm);
  const [editingApiList, setEditingApiList] = useState([]);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [deleteConfirm, setDeleteConfirm] = useState(defaultDeleteConfirm);

  // Redux State Update
  const handleUpdateDetailState = (field, updatedData) => {
    dispatch(
      updateField({ field: `form.detail.${field}`, value: updatedData }),
    );
  };

  // API 등록 폼 업데이트
  const handleUpdateApiRegistForm = (field, updatedData) => {
    setApiRegistForm(
      produce(apiRegistForm, (draft) => {
        draft[field] = updatedData;
      }),
    );
  };

  // 수정중인 API 정보 업데이트
  const handleUpdatedEditingApiItem = (id, field, updatedData) => {
    setEditingApiList(
      produce(editingApiList, (draft) => {
        const targetItem = draft.find((item) => item.id === id);
        targetItem.data[field] = updatedData;
      }),
    );
  };

  // API 등록 핸들링
  const handleAddApi = () => {
    const apiFormMethod = apiRegistForm.method;
    const path = apiRegistForm.path;
    const isDuplicated = apiList.some((api) => api.id === apiFormMethod + path);

    if (path.trim() === '') {
      addToast(intlObj.get(message['store.placeholder.input.path']), 'error');
    } else if (!isValidApiPath(path)) {
      addToast(intlObj.get(message['store.validation.path']), 'error');
    } else {
      if (isDuplicated) {
        addToast(intlObj.get(message['store.validation.duplicate']), 'error');
      } else {
        const nextData = produce(apiList, (draft) => {
          const json = {
            id: apiFormMethod + path,
            path: path,
            method: apiFormMethod,
            qosList: apiRegistForm.qosList,
            showYn: apiRegistForm.showYn,
            info: {
              parameters: [],
              requestBody: {},
            },
          };

          // path parameter 추가
          const pathParameterNames = extractPathParameters(path);
          for (const pathParameter of pathParameterNames) {
            json.info.parameters.push({
              in: 'path',
              name: pathParameter,
              required: true,
              schema: {
                type: 'string',
              },
              example: pathParameter,
            });
          }

          // default body 세팅
          if (apiFormMethod !== 'get') {
            json.info.requestBody = {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {},
                  },
                },
              },
            };
          }

          draft.push(json);
        });
        handleUpdateDetailState('apiList', nextData);
        setApiRegistForm(defaultApiForm);
        addToast(intlObj.get(message['store.success.addApi']), 'success');
      }
    }
  };

  // API 수정 시작 핸들링
  const handleEditApi = (data) => {
    const id = data.method + data.path;
    setEditingApiList(
      produce(editingApiList, (draft) => {
        draft.push({
          id: id,
          data: { ...data },
        });
      }),
    );
  };

  // 수정한 API 저장 핸들링
  const handleSaveEditApi = (id) => {
    const newData = editingApiList.find((item) => item.id === id);
    const newMethod = newData.data.method;
    const path = newData.data.path;
    const pathParameterNames = extractPathParameters(path);
    const isDuplicated = apiList.some(
      (api) => api.id !== id && api.id === newMethod + path,
    );

    if (isDuplicated) {
      addToast(intlObj.get(message['store.validation.duplicate']), 'error');
    } else {
      const nextData = produce(apiList, (draft) => {
        const editedApi = draft.find((item) => item.id === id);
        const prevMethod = editedApi.method; // 수정되기 전의 method 값
        editedApi.id = newMethod + path;
        editedApi.path = path;
        editedApi.method = newMethod;
        editedApi.qosList = newData.data.qosList;
        editedApi.showYn = newData.data.showYn;
        editedApi.info = { ...newData.data.info };

        // 메소드 변경하는 경우 body 핸들링
        if (newMethod === 'get') {
          delete editedApi.info.requestBody;
        } else if (prevMethod === 'get') {
          editedApi.info.requestBody = {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {},
                },
              },
            },
          };
        }

        // path parameter 처리
        const parameters = editedApi.info.parameters || [];
        // path 가 변경됨에 따라 삭제된 path parameter 를 필터링한 목록
        const filteredParameters = parameters.filter(
          (param) =>
            param.in !== 'path' ||
            (param.in === 'path' && pathParameterNames.includes(param.name)),
        );
        for (const pathParameter of pathParameterNames) {
          if (
            !filteredParameters.some(
              (param) => param.in === 'path' && param.name === pathParameter,
            )
          ) {
            filteredParameters.push({
              in: 'path',
              name: pathParameter,
              required: true,
              schema: {
                type: 'string',
              },
            });
          }
        }
        editedApi.info.parameters = filteredParameters;
      });
      handleUpdateDetailState('apiList', nextData);
      setEditingApiList(
        produce(editingApiList, (draft) => {
          return draft.filter((item) => item.id !== id);
        }),
      );
      addToast(intlObj.get(message['store.success.editApi']), 'success');
    }
  };

  // 수정중인 API 취소 핸들링
  const handleCancelEditApi = (id) => {
    setEditingApiList(
      produce(editingApiList, (draft) => {
        return draft.filter((item) => item.id !== id);
      }),
    );
    addToast(intlObj.get(message['store.success.cancelEditApi']), 'success');
  };

  // API 삭제 핸들링
  const handleDeleteApi = (id) => {
    const nextData = produce(apiList, (draft) => {
      return draft.filter((api) => api.id !== id);
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.deleteApi']), 'success');
  };

  // 파라미터 추가 핸들링
  const handleAddParameter = (path, method, data) => {
    const nextData = produce(apiList, (draft) => {
      const targetApi = draft.find((api) => api.id === method + path);
      const targetInfo = targetApi.info;
      targetInfo.parameters.push(data);
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.addParameter']), 'success');
  };

  // 파라미터 저장 핸들링
  const handleSaveParameter = (path, method, _in, name, data) => {
    const nextData = produce(apiList, (draft) => {
      const targetApi = draft.find((api) => api.id === method + path);
      const targetInfo = targetApi.info;
      const targetParameters = targetInfo.parameters;
      const targetParameterIndex = targetParameters.findIndex(
        (param) => param.in + param.name === _in + name,
      );
      targetParameters[targetParameterIndex] = data;
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.editParameter']), 'success');
  };

  // 파라미터 삭제 핸들링
  const handleDeleteParameter = (path, method, _in, name) => {
    const nextData = produce(apiList, (draft) => {
      const targetApi = draft.find((api) => api.id === method + path);
      const targetInfo = targetApi.info;
      const targetParameters = targetInfo.parameters;
      const targetParameterIndex = targetParameters.findIndex(
        (param) => param.in + param.name === _in + name,
      );
      targetParameters.splice(targetParameterIndex, 1);
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.deleteParameter']), 'success');
  };

  // 바디 없는경우 추가 핸들링
  const handleAddBody = (path, method) => {
    const nextData = produce(apiList, (draft) => {
      const targetApi = draft.find((api) => api.id === method + path);
      const targetInfo = targetApi.info;
      targetInfo.requestBody = {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {},
            },
          },
        },
      };
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.addBody']), 'success');
  };

  // 바디 삭제 핸들링
  const handleDeleteBody = (path, method) => {
    const nextData = produce(apiList, (draft) => {
      const targetApi = draft.find((api) => api.id === method + path);
      const targetInfo = targetApi.info;
      targetInfo.requestBody = {};
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.deleteBody']), 'success');
  };

  // 바디 값 업데이트 핸들링
  const handleUpdateBody = (path, method, updatedData) => {
    const nextData = produce(apiList, (draft) => {
      const targetApi = draft.find((api) => api.id === method + path);
      const targetInfo = targetApi.info;
      const requestBody = targetInfo.requestBody;
      const bodyContent = requestBody.content || {};
      const requestBodyType = Object.keys(bodyContent)[0];
      bodyContent[requestBodyType].schema = updatedData;
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.editBody']), 'success');
  };

  // 바디 requestBodyType 업데이트 핸들링
  const handleUpdateRequestBodyType = (path, method, requestType) => {
    const nextData = produce(apiList, (draft) => {
      const targetApi = draft.find((api) => api.id === method + path);
      const targetInfo = targetApi.info;
      const requestBody = targetInfo.requestBody;
      requestBody.content = {
        [requestType]: { schema: { type: 'object' } },
      };
    });
    handleUpdateDetailState('apiList', nextData);
    addToast(intlObj.get(message['store.success.editBody']), 'success');
  };

  const firstRow = {
    method: 'notApi',
    path: 'notApi',
    type: 'input',
    expandable: false,
  };

  const tableData = useMemo(
    () =>
      produce(apiList, (draft) => {
        draft.map((value, index) => {
          if (
            editingApiList.some((item) => item.id === value.method + value.path)
          ) {
            value.expandable = false;
          }
          const requestBody = apiList[index].info?.requestBody || {};
          const bodyContent = requestBody?.content || {};
          const requestBodyType = Object.keys(bodyContent)[0];
          const schema = bodyContent[requestBodyType]?.schema || {};
          value.expandedArea = (
            <Fragment key={index.toString()}>
              <FormRow>
                <FormCol>
                  <FormCol.Strong>Data</FormCol.Strong>
                </FormCol>
              </FormRow>
              <ParameterForm
                info={apiList[index].info}
                onAdd={(newData) =>
                  handleAddParameter(
                    apiList[index].path,
                    apiList[index].method,
                    newData,
                  )
                }
              />
              <ParameterList
                info={apiList[index].info}
                onSave={(_in, name, updatedData) =>
                  handleSaveParameter(
                    apiList[index].path,
                    apiList[index].method,
                    _in,
                    name,
                    updatedData,
                  )
                }
                onDelete={(_in, name) =>
                  handleDeleteParameter(
                    apiList[index].path,
                    apiList[index].method,
                    _in,
                    name,
                  )
                }
              />
              {apiList[index].method !== 'get' && (
                <>
                  <FormRow>
                    <FormCol>
                      {requestBodyType === undefined ? (
                        <FormCol.Strong>Body</FormCol.Strong>
                      ) : (
                        <Dropdown
                          title={
                            <FormCol.Strong>
                              Body{` (${requestBodyType})`}
                            </FormCol.Strong>
                          }
                          items={[
                            {
                              key: 'application/json',
                              value: 'application/json',
                              label: 'application/json',
                              onClick: (item) => {
                                if (requestBodyType !== item.key) {
                                  handleUpdateRequestBodyType(
                                    apiList[index].path,
                                    apiList[index].method,
                                    item.key,
                                  );
                                }
                              },
                            },
                            {
                              key: 'multipart/form-data',
                              value: 'multipart/form-data',
                              label: 'multipart/form-data',
                              onClick: (item) => {
                                if (requestBodyType !== item.key) {
                                  handleUpdateRequestBodyType(
                                    apiList[index].path,
                                    apiList[index].method,
                                    item.key,
                                  );
                                }
                              },
                            },
                          ]}
                        />
                      )}
                    </FormCol>
                  </FormRow>
                  {requestBodyType !== undefined ? (
                    <BodyForm
                      requestBodyType={requestBodyType}
                      schema={schema}
                      onSave={(updatedData) =>
                        handleUpdateBody(
                          apiList[index].path,
                          apiList[index].method,
                          updatedData,
                        )
                      }
                      onDelete={() =>
                        handleDeleteBody(
                          apiList[index].path,
                          apiList[index].method,
                        )
                      }
                    />
                  ) : (
                    <FormRow>
                      <FormCol>
                        <Buttons.Outlined
                          type={'grey'}
                          onClick={() =>
                            handleAddBody(
                              apiList[index].path,
                              apiList[index].method,
                            )
                          }
                        >
                          {intlObj.get(message['store.add'])}
                        </Buttons.Outlined>
                      </FormCol>
                    </FormRow>
                  )}
                </>
              )}
            </Fragment>
          );
        });
        draft.splice(0, 0, firstRow);
      }),
    [apiRegistForm, apiList, editingApiList, intlObj, message],
  );

  const tableColumns = [
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      width: 'auto',
      resize: true,
      render: (text, record) => {
        const id = record.id;
        const editingItem = editingApiList.find((item) => item.id === id);
        return record.type === 'input' ? (
          <Division flex={true} gap={10}>
            <Select
              value={apiRegistForm.method}
              options={methodOptions}
              onSelect={(_, value) =>
                handleUpdateApiRegistForm('method', value.value)
              }
            />
            <Input
              value={apiRegistForm.path}
              placeholder={intlObj.get(message['store.placeholder.input.path'])}
              onChange={(e) =>
                handleUpdateApiRegistForm('path', e.target.value)
              }
              maxLength={100}
              showCount={true}
            />
          </Division>
        ) : editingItem !== undefined ? (
          <Division flex={true} gap={10}>
            <Select
              value={editingItem.data.method}
              options={methodOptions}
              onSelect={(_, value) =>
                handleUpdatedEditingApiItem(id, 'method', value.value)
              }
            />
            <Input
              value={editingItem.data.path}
              placeholder={intlObj.get(message['store.placeholder.input.path'])}
              onChange={(e) =>
                handleUpdatedEditingApiItem(id, 'path', e.target.value)
              }
              maxLength={100}
              showCount={true}
            />
          </Division>
        ) : (
          <Division flex={true} gap={10} alignItems={'center'}>
            <Method method={record.method} />
            <Ellipsis>{text}</Ellipsis>
          </Division>
        );
      },
      onCell: (record) => ({
        colSpan: record?.expandable === false ? 2 : 1,
        style:
          record?.expandable === false
            ? {}
            : {
                paddingLeft: 0,
              },
      }),
    },
    {
      title: intlObj.get(message['store.settingQos']),
      key: 'qos',
      ellipsis: true,
      align: 'center',
      width: '30%',
      resize: true,
      render: (text, record, index) => {
        const id = record.id;
        const editingItem = editingApiList.find((item) => item.id === id);
        return record.type === 'input' ? (
          <QosForm
            list={apiRegistForm.qosList}
            serviceType={serviceType}
            onChange={(updatedData) =>
              handleUpdateApiRegistForm('qosList', updatedData)
            }
          />
        ) : editingItem !== undefined ? (
          <QosForm
            list={editingItem.data.qosList}
            serviceType={serviceType}
            onChange={(updatedData) =>
              handleUpdatedEditingApiItem(id, 'qosList', updatedData)
            }
          />
        ) : (
          <QosForm
            list={record.qosList}
            serviceType={serviceType}
            readOnly={true}
          />
        );
      },
    },
    {
      title: intlObj.get(message['store.showY']),
      dataIndex: 'showYn',
      key: 'showYn',
      ellipsis: true,
      align: 'center',
      width: '12%',
      resize: true,
      render: (text, record, index) => {
        const id = record.id;
        const editingItem = editingApiList.find((item) => item.id === id);
        return record.type === 'input' ? (
          <Select
            value={apiRegistForm.showYn}
            options={showYnOptions}
            onSelect={(_, value) =>
              handleUpdateApiRegistForm('showYn', value.value)
            }
          />
        ) : editingItem !== undefined ? (
          <Select
            value={editingItem.data.showYn}
            options={showYnOptions}
            onSelect={(_, value) =>
              handleUpdatedEditingApiItem(id, 'showYn', value.value)
            }
          />
        ) : record.showYn === 'Y' ? (
          intlObj.get(message['store.showY'])
        ) : (
          intlObj.get(message['store.showN'])
        );
      },
    },
    {
      title: intlObj.get(message['store.manage']),
      dataIndex: 'manage',
      key: 'manage',
      ellipsis: true,
      align: 'center',
      width: '11%',
      resize: true,
      render: (text, record, index) => {
        const id = record.id;
        return record.type === 'input' ? (
          <Buttons.Outlined type={'grey'} onClick={handleAddApi}>
            {intlObj.get(message['store.add'])}
          </Buttons.Outlined>
        ) : editingApiList.some((item) => item.id === id) ? (
          <Division flex={true} gap={4} justifyContent={'center'}>
            <Buttons.IconSave
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEditApi(record.id);
              }}
            />
            <Buttons.IconCancel
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEditApi(record.id);
              }}
            />
          </Division>
        ) : (
          <Division flex={true} gap={4} justifyContent={'center'}>
            <Buttons.IconEdit
              onClick={(e) => {
                e.stopPropagation();
                handleEditApi(record);
              }}
            />
            <Buttons.IconDeleteRed
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm({
                  open: true,
                  targetId: record.id,
                });
              }}
            />
          </Division>
        );
      },
    },
  ];

  return (
    <>
      <CollapseTable
        rowKey={(record) => record.method + record.path}
        columns={tableColumns}
        data={tableData}
        pagination={{
          position: ['bottomCenter'],
          showAllItems: true,
          pageSize: pageSize,
        }}
        paginationExtraContent={
          <Select
            value={pageSize}
            options={pageSizeOptions}
            onSelect={(_, value) => setPageSize(value.value)}
          />
        }
      />
      <Confirm
        open={deleteConfirm?.open}
        title={intlObj.get(message['store.deleteApi'])}
        desc={intlObj.get(message['store.confirm.deleteApi'])}
        okText={intlObj.get(message['store.ok'])}
        cancelText={intlObj.get(message['store.cancel'])}
        onOk={() => {
          handleDeleteApi(deleteConfirm?.targetId);
          setDeleteConfirm(defaultDeleteConfirm);
        }}
        onCancel={() => setDeleteConfirm(defaultDeleteConfirm)}
      />
    </>
  );
};

export default IpList;

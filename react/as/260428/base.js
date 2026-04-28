const gwHeaderCode = Number(baseState?.gwHeaderCode ?? 0);
const selectedGwHeaderCode = Number(
  baseState?.selectedGwHeaderCode ?? gwHeaderCode
);

value={selectedGwHeaderCode}

onChange={(value) => {
  handleUpdateBaseState('isUpdated', true);
  handleUpdateBaseState('selectedGwHeaderCode', Number(value));
}}

selectedGwHeaderCod
gwHeaderCode: Number(baseState.selectedGwHeaderCode)

<Col span={6}>
  <Form.Label label={intlObj.get(message['store.gwHeader'])} />
  <Select
    width={'100%'}
    maxWidth={200}
    options={gwHeaderOptions}
    value={selectedGwHeaderCode}
    onChange={(value) => {
      handleUpdateBaseState('isUpdated', true);
      handleUpdateBaseState('selectedGwHeaderCode', Number(value));
    }}
  />
</Col>


import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';

export const getDocumentTypes = () => [
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

export const getAutoApprOptions = () => [
  {
    label: intlObj.get(message['store.autoApprN']),
    value: 'N',
  },
  {
    label: intlObj.get(message['store.autoApprY']),
    value: 'Y',
  },
];

export const getGwHeaderOptions = () => [
  {
    label: intlObj.get(message['store.gwHeader.code0']),
    value: 0,
  },
  {
    label: intlObj.get(message['store.gwHeader.code1']),
    value: 1,
  },
];

import {
  getDocumentTypes,
  getAutoApprOptions,
  getGwHeaderOptions,
} from '@/utils/selectOptions';

const documentTypes = useMemo(() => getDocumentTypes(), []);
const autoApprOptions = useMemo(() => getAutoApprOptions(), []);
const gwHeaderOptions = useMemo(() => getGwHeaderOptions(), []);


const gwHeaderCode = Number(baseState?.gwHeaderCode ?? 0);

const selectedGwHeaderCode = Number(
  baseState?.selectedGwHeaderCode ?? gwHeaderCode,
);
<Select
  width={'100%'}
  maxWidth={200}
  options={gwHeaderOptions}
  value={selectedGwHeaderCode}
  onChange={(value) => {
    handleUpdateBaseState('isUpdated', true);
    handleUpdateBaseState('selectedGwHeaderCode', Number(value));
  }}
/>



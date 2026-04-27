// Detail.jsx
const keyState = useSelector((state) => state.get('keySelect')) || {};
const keyList = keyState?.keyList || [];
const selectedKeyId = keyState?.selectedKeyId;

const selectedKey =
  keyList.find((key) => key.keyId === selectedKeyId) || keyList[0];

const hasGwHeaderCode = serviceDetail?.gwHeaderCode != null;

const gwHeaderName =
  serviceDetail?.gwHeaderCode === 0
    ? intlObj.get(message['store.gwHeader.code0'])
    : intlObj.get(message['store.gwHeader.code1']);

const keyTokenExample = selectedKey?.keyName
  ? `{${selectedKey.keyName} Token}`
  : '{KEY Token}';


{hasGwHeaderCode && (
  <>
    <ContentHeader
      $border={true}
      spacing={20}
      title={intlObj.get(message['store.gwHeader'])}
    />
    <DescriptionArea>
      <DescriptionContent>
        <Description>
          {`"${gwHeaderName}" : Bearer ${keyTokenExample}`}
        </Description>
      </DescriptionContent>
    </DescriptionArea>
  </>
)}

//핵심은 이것도 마찬가지로 0이 유효값이라 조건을 이렇게 잡아야 해.
const hasGwHeaderCode = serviceDetail?.gwHeaderCode != null;

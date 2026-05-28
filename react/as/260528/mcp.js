import { useMemo, useState } from 'react';
import styled from 'styled-components';

import Buttons from '@/components/Atoms/Buttons';
import Division from '@/components/Atoms/Division';
import FormRow from '@/components/Atoms/FormRow';
import FormCol from '@/components/Atoms/FormCol';
import { MCP_CONFIG_SAMPLES } from '@/utils/mcpConfigSamples';

const McpConfigGuide = ({ api }) => {
  const samples = useMemo(() => MCP_CONFIG_SAMPLES, []);
  const [selectedSampleKey, setSelectedSampleKey] = useState(samples[0]?.key);

  const selectedSample = samples.find(
    (sample) => sample.key === selectedSampleKey,
  );

  const jsonSample = useMemo(() => {
    if (!selectedSample?.value) return '';

    return typeof selectedSample.value === 'string'
      ? selectedSample.value
      : JSON.stringify(selectedSample.value, null, 2);
  }, [selectedSample]);

  const handleCopySample = async () => {
    await navigator.clipboard.writeText(jsonSample);
  };

  return (
    <>
      <FormRow>
        <FormCol span={24}>
          <Division
            flex={true}
            alignItems={'center'}
            justifyContent={'flex-start'}
            gap={15}
          >
            {samples.map((sample) => (
              <Buttons.Selectable
                key={sample.key}
                active={sample.key === selectedSampleKey}
                onClick={() => setSelectedSampleKey(sample.key)}
              >
                {sample.label}
              </Buttons.Selectable>
            ))}
          </Division>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol span={24}>
          <FormCol.Strong>config.json</FormCol.Strong>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol span={24}>
          <SampleBox onClick={handleCopySample}>{jsonSample}</SampleBox>
        </FormCol>
      </FormRow>
    </>
  );
};

export default McpConfigGuide;

const SampleBox = styled.pre`
  font-size: 13px;
  font-weight: 300;
  background: #333333;
  border-radius: 4px;
  padding: 12px;
  color: #ffffff;
  margin: 0;
  max-height: 500px;
  cursor: pointer;
  white-space: pre-wrap;
  word-break: break-all;

  &:hover {
    opacity: 0.95;
  }
`;

// util/mcpConfigSamples.js
export const MCP_CONFIG_SAMPLES = [
  {
    key: 'basic',
    label: 'Basic',
    value: {
      mcpServers: {
        sample: {
          url: 'https://example.com/mcp',
        },
      },
    },
  },
  {
    key: 'headerAuth',
    label: 'Header Auth',
    value: {
      mcpServers: {
        sample: {
          url: 'https://example.com/mcp',
          headers: {
            Authorization: 'Bearer ${TOKEN}',
          },
        },
      },
    },
  },
  {
    key: 'local',
    label: 'Local',
    value: {
      mcpServers: {
        sample: {
          command: 'node',
          args: ['server.js'],
        },
      },
    },
  },
];

//Buttoncss
const selectablePrimaryStyle = css`
  color: rgb(112, 79, 248);
  background: transparent;
  border: 1px solid rgb(112, 79, 248);

  &:hover {
    color: #ffffff;
    border: 1px solid transparent;
    background: rgba(112, 79, 248, 0.7);
    box-shadow: 0px 0px 9px rgba(0, 0, 0, 0.1);
  }
`;

const selectableActiveStyle = css`
  color: #ffffff;
  border: 1px solid transparent;
  background: rgba(112, 79, 248, 0.7);
  box-shadow: 0px 0px 9px rgba(0, 0, 0, 0.1);
`;

const SelectableButtonLayout = styled.button`
  .${({ theme }) => theme.namespace} & {
    ${(props) =>
      props.minWidth &&
      css`
        min-width: ${props.minWidth}px;
      `}

    ${selectablePrimaryStyle}

    ${(props) => props.active && selectableActiveStyle}

    ${(props) =>
      props.size === 'small'
        ? smallStyle
        : props.size === 'medium'
          ? mediumStyle
          : largeStyle}
  }
`;

const Selectable = ({
  size = 'large',
  minWidth,
  active = false,
  ...props
}) => {
  return (
    <SelectableButtonLayout
      size={size}
      minWidth={minWidth}
      active={active}
      {...props}
    >
      {props.children}
    </SelectableButtonLayout>
  );
};


//apiList.jsx
const mcpTableData = useMemo(
  () =>
    produce(apiList, (draft) => {
      draft.forEach((value, index) => {
        const api = apiList[index];

        value.expandedArea = <McpConfigGuide api={api} />;
      });
    }),
  [apiList],
);

const mcpTableData = useMemo(
  () =>
    apiList.map((api) => ({
      ...api,
      expandedArea: <McpConfigGuide api={api} />,
    })),
  [apiList],
);
const tableData = useMemo(
  () =>
    apiList.map((api) => {
      const info = api?.info;

      return {
        ...api,
        expandedArea: (
          <TestConsole
            server={ensureProtocol(server)}
            path={api?.path}
            method={api?.method}
            excutable={excutable}
            parameters={info?.parameters || []}
            requestBody={info?.requestBody || {}}
            apiKey={selectedKey}
            gwHeader={serviceDetail?.gwHeader}
          />
        ),
      };
    }),
  [apiList, serviceType, svcId, selectedKey],
);






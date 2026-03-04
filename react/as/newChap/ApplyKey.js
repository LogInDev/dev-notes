import styled from 'styled-components';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import ApplyKeyIcon from '@/assets/images/common/icon_apply_key.svg?react';

/**
 * 키가 존재하지 않는 경우 출력하는 키 신청 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {Function} [props.onClick] - 클릭 이벤트 핸들러
 */
const ApplyKey = ({ onClick, ...props }) => {
  return (
    <ApplyKeyLayout onClick={onClick} {...props}>
      <ApplyKeyIcon />
      <span>{intlObj.get(message['store.applyKey'])}</span>
    </ApplyKeyLayout>
  );
};

export default ApplyKey;

const ApplyKeyLayout = styled.div`
  .${({ theme }) => theme.namespace} & {
    padding: 3px 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    border: 1px solid #5630f0;
    background: #f2f3fe;
    cursor: pointer;

    span {
      font-size: 14px;
      font-weight: 400;
      color: #5630f0;
    }
  }
`;

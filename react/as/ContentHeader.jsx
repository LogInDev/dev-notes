import Division from '@/components/Atoms/Division';
import styled from 'styled-components';

/**
 * 콘텐츠 헤더 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} [props.title] - 메인 제목
 * @param {React.ReactNode} [props.subTitle] - 부제목
 * @param {React.ReactNode} [props.extraContent=false] - 추가 콘텐츠
 * @param {number} [props.spacing=0] - 상하 여백
 * @param {boolean} [props.$border=false] - 하단 테두리 표시 여부
 * @param {Object} [props.style={}] - 추가 스타일
 * @param {number} [props.paddingBottom=10] - 하단 패딩
 */
const ContentHeader = ({
  title,
  subTitle,
  extraContent = false,
  spacing = 0,
  $border = false,
  style = {},
  paddingBottom = 10,
}) => {
  return (
    <ContentHeaderLayout
      spacing={spacing}
      $border={$border}
      style={style}
      $paddingBottom={paddingBottom}
    >
      <Division flex={true} alignItems={'center'} gap={8}>
        <Title>{title}</Title>
        {subTitle && <SubTitle>{subTitle}</SubTitle>}
      </Division>
      {extraContent && <ExtraContents>{extraContent}</ExtraContents>}
    </ContentHeaderLayout>
  );
};

export default ContentHeader;

const ContentHeaderLayout = styled.div`
  .${({ theme }) => theme.namespace} & {
    margin-bottom: ${(props) => (props.spacing ? `${props.spacing}` : 0)}px;
    padding-bottom: ${(props) => props.$paddingBottom}px;
    /* padding-bottom: 10px; */
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    ${(props) => (props.$border ? 'border-bottom: 1px solid #555555;' : '')};
  }
`;

const Title = styled.div`
  .${({ theme }) => theme.namespace} & {
    font-size: 20px;
    font-weight: 600;
    color: #333333;
  }
`;

const ExtraContents = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }
`;

const SubTitle = styled.div`
  .${({ theme }) => theme.namespace} & {
    font-size: 16px;
    font-weight: 300;
    color: #333333;
  }
`;

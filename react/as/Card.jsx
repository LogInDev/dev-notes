import styled, { css } from 'styled-components';
import Icons from '@/components/Atoms/Icons';

const Card = ({
  category,
  title,
  subTitle,
  description,
  vwCnt,
  subCount,
  style = {},
  extra,
  onClick = () => {},
}) => {
  return (
    <>
      <CardLayout style={style} onClick={onClick}>
        <CategoryCantainer>{category}</CategoryCantainer>
        <TitleContainer subTitle={subTitle}>{title}</TitleContainer>
        {subTitle && <SubtitleContainer>{subTitle}</SubtitleContainer>}
        <DescriptionContainer>{description}</DescriptionContainer>
        <CountContainer>
          <ViewContainer>
            <Icons.ViewCount /> {vwCnt}
          </ViewContainer>
          <ViewContainer>
            <Icons.SubCount /> {subCount}
          </ViewContainer>
          <ButtonContainer>{extra}</ButtonContainer>
        </CountContainer>
      </CardLayout>
    </>
  );
};

export default Card;

const CardLayout = styled.div`
  .${({ theme }) => theme.namespace} & {
    /* max-width: 422px; */
    /* height: 230px; */
    padding: 10px 14px;
    position: relative;
    border-radius: 16px;
    height: 180px;
    /* display: flex; */
    /* flex-direction: column; */
    /* justify-content: space-between; */
  }
`;

const CategoryCantainer = styled.span`
  .${({ theme }) => theme.namespace} & {
    font-size: 14px;
    font-weight: 300;
    color: #777777;
  }
`;

const TitleContainer = styled.h5`
  .${({ theme }) => theme.namespace} & {
    font-size: 16px;
    margin-bottom: 0.5em;
    font-weight: 500;
    margin-top: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    ${(props) =>
      props.subTitle
        ? css`
            margin-bottom: 0px;
            line-height: 1.2;
          `
        : ''}
  }
`;

const SubtitleContainer = styled.p`
  .${({ theme }) => theme.namespace} & {
    font-weight: 200;
    margin-bottom: 0.4em;
    font-size: 14px;
    text-overflow: ellipsis;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
`;

const DescriptionContainer = styled.p`
  .${({ theme }) => theme.namespace} & {
    font-size: 14px;
    font-weight: 200;
    color: #555555;
    text-overflow: ellipsis;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;

const CountContainer = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    position: absolute;
    bottom: 14px;
    left: 0;
    padding: 0 24px;
    width: 100%;
  }
`;

const ViewContainer = styled.div`
  .${({ theme }) => theme.namespace} & {
    margin-right: 10px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 5px;
  }
`;

const ButtonContainer = styled.div`
  .${({ theme }) => theme.namespace} & {
    margin-left: auto;
  }
`;

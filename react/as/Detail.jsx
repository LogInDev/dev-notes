import { forwardRef, useEffect } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServiceDetail } from '@/store/reduxStore/detail/reducer';
import dayjs from 'dayjs';
import { Skeleton } from 'signlw';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import ContentHeader from '@/components/Organisms/ContentHeader';
import Ellipsis from '@/components/Atoms/Ellipsis';
import ModelName from '@/components/Atoms/ModelName';
import Buttons from '@/components/Atoms/Buttons';
import Division from '@/components/Atoms/Division';

const Detail = forwardRef((_, ref) => {
  const { svcId } = useParams();

  const dispatch = useDispatch();

  const categoryState = useSelector((state) => state.get('category')) || {};
  const categoryLanguage = categoryState?.language;

  const detailState = useSelector((state) => state.get('detail'))?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const fetchServiceDetailLoading =
    detailState?.fetchServiceDetailLoading || false;
  const documentList = serviceDetail?.documentList || [];

  useEffect(() => {
    dispatch(fetchServiceDetail({ svcId }));
  }, []);

  // 링크 클릭 시 핸들링
  const handleClickLink = (url) => {
    const currentProtocol = window.location.protocol; // http: 또는 https:

    // URL이 상대 경로인지 확인
    const isRelativeUrl =
      !url.startsWith('http://') && !url.startsWith('https://');

    // 상대 경로인 경우 절대 경로로 변환
    const absoluteUrl = isRelativeUrl ? `${currentProtocol}//${url}` : url;

    // 새 창으로 열기
    window.open(absoluteUrl, '_blank');
  };

  return fetchServiceDetailLoading ? (
    <Skeleton active={true} />
  ) : (
    <div ref={ref}>
      <ContentHeader
        $border={true}
        title={
          <Division maxWidth={1150}>
            <Ellipsis>
              <>
                {serviceDetail?.svcType !== 'API'
                  ? `[${serviceDetail?.svcType}] `
                  : ''}
                {serviceDetail?.svcNm || ''}
              </>
              {serviceDetail?.svcType === 'LLM' && (
                <ModelName delimiterLeft={true}>
                  {serviceDetail?.svcModel}
                </ModelName>
              )}
            </Ellipsis>
          </Division>
        }
        subTitle={categoryLanguage?.[serviceDetail?.catId] || ''}
        extraContent={
          <>
            <Division flex={true} gap={4}>
              <Division.SubTitle>
                {intlObj.get(message['store.updDttm'])}
              </Division.SubTitle>
              <div>
                {serviceDetail?.updDttm
                  ? dayjs(serviceDetail?.updDttm).format('YYYY.MM.DD')
                  : '-'}
              </div>
            </Division>
          </>
        }
        spacing={20}
      />
      <DescriptionArea>
        <DescriptionContent>
          <Description>{serviceDetail.svcDesc}</Description>
        </DescriptionContent>
        {documentList?.length > 0 ? (
          <DescriptionFooter>
            {documentList.map((document, index) =>
              document.dtlCd === 'FAQ' ? (
                <Buttons.OpenLink
                  key={index}
                  onClick={() => handleClickLink(document.dtlLink)}
                >
                  Q&A
                </Buttons.OpenLink>
              ) : document.dtlCd === 'IFW' ? (
                <Buttons.OpenLink
                  key={index}
                  onClick={() => handleClickLink(document.dtlLink)}
                >
                  {intlObj.get(message['store.iflow'])}
                </Buttons.OpenLink>
              ) : (
                <Buttons.OpenLink
                  key={index}
                  onClick={() => handleClickLink(document.dtlLink)}
                >
                  {document.linkNm}
                </Buttons.OpenLink>
              ),
            )}
          </DescriptionFooter>
        ) : (
          <></>
        )}
      </DescriptionArea>
    </div>
  );
});

export default Detail;

const DescriptionArea = styled.div`
  border-radius: 16px;
  overflow: clip;
`;

const DescriptionContent = styled.div`
  padding: 24px;
  background: #f2f3fe;
`;

const Description = styled.pre`
  font-size: 14px;
  font-weight: 300;
  color: #555555;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 0;
  white-space: pre-wrap;
`;

const DescriptionFooter = styled.div`
  padding: 24px;
  background: #ebedff;
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 10px;
  flex-wrap: wrap;
`;

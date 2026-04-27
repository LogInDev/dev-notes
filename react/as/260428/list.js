const hasGwHeaderCode = serviceDetail?.gwHeaderCode != null;

const gwHeaderText =
  serviceDetail?.gwHeaderCode === 0
    ? intlObj.get(message['store.gwHeader.code0'])
    : intlObj.get(message['store.gwHeader.code1']);


{serviceDetail?.gwDomain && (
  <Division flex={true} gap={20} alignItems={'center'} mb={20}>
    <Division.Title>API G/W Domain</Division.Title>
    <Division.SubTitle>
      {process.env.VITE_APP_ENV === 'staging'
        ? `${getStgGatewayUrl(serviceType)}${getGatewayPrefix(serviceType, svcId)}`
        : `${serviceDetail?.gwDomain}${getGatewayPrefix(serviceType, svcId)}`}
    </Division.SubTitle>
  </Division>
)}

{hasGwHeaderCode && (
  <Division flex={true} gap={20} alignItems={'center'} mb={20}>
    <Division.Title>API G/W 인증 Header</Division.Title>
    <Division.SubTitle>{gwHeaderText}</Division.SubTitle>
  </Division>
)}


<TestConsole
  server={ensureProtocol(server)}
  path={api?.path}
  method={api?.method}
  excutable={excutable}
  parameters={parameters}
  requestBody={requestBody}
  apiKey={selectedKey}
  gwHeaderCode={serviceDetail?.gwHeaderCode}
/>


const TestConsole = ({
  server,
  path,
  method,
  excutable = false,
  parameters = [],
  requestBody = {},
  apiKey = {},
  gwHeaderCode,
}) => {
  const requestBody = {
  svcId,
  server,
  path,
  method,
  parameters: requestParameters,
  body: method !== 'get' && bodyState ? JSON.parse(bodyState) : undefined,
  keyId: apiKey?.keyId,
  keyPub: apiKey?.keyPub,
  gwHeaderCode,
};
  formData.append('svcId', svcId);
formData.append('server', server);
formData.append('path', path);
formData.append('method', method);
formData.append('keyId', apiKey?.keyId);
formData.append('keyPub', apiKey?.keyPub);
formData.append('gwHeaderCode', gwHeaderCode);
formData.append('parameters', JSON.stringify(requestParameters));


  @Getter
@Setter
public class ReqParamVO {

    private Long svcId;
    private String server;
    private String path;
    private String method;
    private String keyId;
  
    private String keyPub;
    private Integer gwHeaderCode;

    private ReqParametersVO parameters;
    private Object body;
}

  import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum GwHeaderCode {

    HCP_GW(0, "Authorization-HCP-GW"),
    AUTHORIZATION(1, "Authorization");

    private final int code;
    private final String headerName;

    public static String getHeaderNameByCode(Integer code) {
        return Arrays.stream(values())
                .filter(item -> item.code == code)
                .map(GwHeaderCode::getHeaderName)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid gwHeaderCode: " + code));
    }
}

// ApiConsoleService.java
public ResponseEntity<ResponseMessage> execute(ReqParamVO reqParams) {

    try {
        String urlString = buildUrl(reqParams);
        URI uri = new URI(urlString);

        HttpHeaders headers = buildHeadersWithBearer(reqParams);

        if (reqParams.getParameters() != null
                && reqParams.getParameters().getHeader() != null) {

            for (int i = 0; i < reqParams.getParameters().getHeader().size(); i++) {
                headers.set(
                        reqParams.getParameters().getHeader().get(i).getName(),
                        reqParams.getParameters().getHeader().get(i).getExample()
                );
            }
        }

        String json = StringUtils.EMPTY;
        if (!ObjectUtils.isEmpty(reqParams.getBody())) {
            json = getJsonStringFromObj(reqParams.getBody());
        }

        HttpEntity<Object> requestEntity = new HttpEntity<>(json, headers);

        ResponseEntity<byte[]> response = restTemplate.exchange(
                uri,
                HttpMethod.valueOf(reqParams.getMethod().toUpperCase()),
                requestEntity,
                byte[].class
        );

        return processResponse(response);

    } catch (HttpClientErrorException | HttpServerErrorException e) {
        Map<String, Object> responseMap = new HashMap<>();

        String errorBody = e.getResponseBodyAsString();
        HttpHeaders responseHeaders = e.getResponseHeaders();

        responseMap.put("status", e.getRawStatusCode());
        responseMap.put("body", errorBody);
        responseMap.put("headers", responseHeaders.toSingleValueMap());

        return new ResponseEntity<>(
                new ResponseMessage(ResponseCode.SUCCESS, responseMap, errorBody),
                HttpStatus.OK
        );

    } catch (Exception e) {
        Map<String, Object> responseMap = new HashMap<>();

        responseMap.put("status", HttpStatus.INTERNAL_SERVER_ERROR);
        responseMap.put("body", e.getMessage());

        return new ResponseEntity<>(
                new ResponseMessage(ResponseCode.SUCCESS, responseMap, e.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

private HttpHeaders buildHeadersWithBearer(ReqParamVO reqParams) {
    HttpHeaders headers = new HttpHeaders();

    if (reqParams.getGwHeaderCode() != null
            && StringUtils.hasText(reqParams.getKeyPub())) {

        String headerName = GwHeaderCode.getHeaderNameByCode(reqParams.getGwHeaderCode());

        headers.set(headerName, "Bearer " + reqParams.getKeyPub());
    }

    return headers;
}

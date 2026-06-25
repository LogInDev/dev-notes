SET TIMING ON;      -- 쿼리 수행 시간을 화면에 표시
SET AUTOTRACE ON;   -- 쿼리 실행 후 실행계획 및 통계(I/O) 정보를 화면에 표시

-- [테스트 1] 기존 쿼리 수행
SELECT * FROM ( ... 기존 쿼리 ... ) RESULT;

-- [테스트 2] 최적화 쿼리 수행
SELECT * FROM ( ... 최적화 쿼리 ... ) RESULT;

SET AUTOTRACE OFF;
SET TIMING OFF;

elapsed time⁠: 실제 걸린 시간
⁠consistent gets⁠: 메모리에서 읽은 블록 수 (이 값이 작을수록 무조건 좋은 쿼리입니다)


SELECT * FROM ( 
    SELECT 
        SVC.SVC_ID, 
        NVL(AUTH.AUTH_YN, 'NON') AS AUTH_YN, -- 미리 집계된 권한 매핑 (없으면 NON)
        SVC.SVC_NM, 
        SVC.SVC_DESC, 
        SVC.SVC_TYPE, 
        SVC.SVC_MODEL, 
        SVC.REG_DTTM, 
        SVC.UPD_DTTM, 
        CAT.*, 
        SVC.VW_CNT, 
        SVC.AUTO_APPR, 
        NVL(CNT.SUB_COUNT, 0) AS SUB_COUNT, 
        CASE 
            WHEN INSTR(SUB.sub_stat_cd_str, 'APR') > 0 THEN 'APR' 
            WHEN INSTR(SUB.sub_stat_cd_str, 'NOR') > 0 THEN 'NOR' 
            ELSE 'N' 
        END AS SUB_STAT_CD 
    FROM 
        (SELECT * FROM HCP_API_SVC WHERE SVC_ENV = 'DEV') SVC, 
        (
            SELECT 
                CODE_ID AS CAT_ID, 
                CODE_NM AS CAT_PATH, 
                CODE_NM AS CAT_NM, 
                HAC.NAME_KOR AS CAT_NAME_KO, 
                HAC.NAME_ENG AS CAT_NAME_EN, 
                HAC.NAME_CHN AS CAT_NAME_ZH 
            FROM HCP_BASE_CODE HBC 
            JOIN HCP_API_CODEDETAIL HAC ON HAC.CODE_CD = HBC.CODE_ID AND HAC.CODE_GRP_CD = 'STORE_CATE' 
            WHERE CODE_CAT = 'HCP_API_CATEGORY' AND USE_YN = 'Y'
        ) CAT, 
        (
            SELECT 
                API.SVC_ID, 
                COUNT(DISTINCT SUB.KEY_ID) AS SUB_COUNT 
            FROM HCP_API_BASE API, 
                 HCP_API_PUB PUB, 
                 HCP_API_SUB SUB 
            WHERE API.API_ID = PUB.API_ID 
              AND PUB.PUB_ID = SUB.PUB_ID(+) 
              AND API.SHOW_YN = 'Y' 
              AND SUB.SUB_STAT_CD = 'NOR' 
            GROUP BY API.SVC_ID
        ) CNT, 
        ( 
            SELECT 
                z.svc_id, 
                LISTAGG(z.SUB_STAT_CD, ',') WITHIN GROUP (ORDER BY z.sub_stat_cd) AS sub_stat_cd_str 
            FROM ( 
                SELECT 
                    API.SVC_ID, 
                    SUB.SUB_STAT_CD 
                FROM HCP_API_BASE API, 
                     HCP_API_PUB PUB, 
                     HCP_API_SUB SUB 
                WHERE API.API_ID = PUB.API_ID 
                  AND PUB.PUB_ID = SUB.PUB_ID(+) 
                  AND API.SHOW_YN = 'Y' 
                  AND SUB.KEY_ID(+) = 527 
                GROUP BY api.svc_id, sub.sub_stat_cd 
            ) z 
            GROUP BY z.svc_id 
        ) SUB,
        /* [최적화 핵심] KEY_ID=117에 대한 권한 상태를 SVC_ID 단위로 사전 집계하는 인라인 뷰 */
        (
            SELECT 
                A.SVC_ID,
                CASE MAX(CASE WHEN A.STAT = 'NOR' THEN 2 WHEN A.STAT = 'APR' THEN 1 END)
                    WHEN 2 THEN 'NOR'
                    WHEN 1 THEN 'APR'
                END AS AUTH_YN
            FROM (
                -- 1. 프로젝트 권한 확인 (NOR 등급)
                SELECT hasa.SVC_ID, 'NOR' AS STAT
                FROM HCP_API_KEY_AUTH haka,
                     HCP_API_SVC_AUTH hasa
                WHERE haka.PRJ_ID = hasa.AUTH_ID
                  AND hasa.AUTH_ID IS NOT NULL
                  AND haka.KEY_ID = 117
                UNION ALL
                -- 2. 신청 상태 확인 (NOR과 APR을 한 번에 스캔하여 성능 극대화)
                SELECT REQ.SVC_ID, REQ.REQ_STAT_CD AS STAT
                FROM HCP_API_SVC_REQ REQ,
                     HCP_API_KEY_AUTH KEY
                WHERE REQ.REQ_STAT_CD IN ('NOR', 'APR')
                  AND REQ.KEY_ID = KEY.KEY_ID
                  AND KEY.KEY_ID = 117
            ) A
            GROUP BY A.SVC_ID
        ) AUTH
    WHERE SVC.CAT_ID = CAT.CAT_ID 
      AND SVC.SVC_ID = CNT.SVC_ID(+) 
      AND SVC.SVC_ID = SUB.SVC_ID(+) 
      AND SVC.SVC_ID = AUTH.SVC_ID(+) -- 인라인 뷰 아우터 조인 연결
      AND SVC.SHOW_YN = 'Y' 
      AND SVC.DEL_YN = 'N' 
    ORDER BY SVC.SVC_ID DESC 
) RESULT



WITH AUTH AS (
    SELECT
        SVC_ID,
        CASE MAX(PRIORITY)
            WHEN 2 THEN 'NOR'
            WHEN 1 THEN 'APR'
        END AS AUTH_YN
    FROM (
        SELECT
            HASA.SVC_ID,
            2 PRIORITY
        FROM HCP_API_KEY_AUTH HAKA
        JOIN HCP_API_SVC_AUTH HASA
            ON HAKA.PRJ_ID = HASA.AUTH_ID
        WHERE HAKA.KEY_ID = 117
          AND HASA.AUTH_ID IS NOT NULL

        UNION ALL

        SELECT
            REQ.SVC_ID,
            2 PRIORITY
        FROM HCP_API_SVC_REQ REQ
        WHERE REQ.KEY_ID = 117
          AND REQ.REQ_STAT_CD = 'NOR'

        UNION ALL

        SELECT
            REQ.SVC_ID,
            1 PRIORITY
        FROM HCP_API_SVC_REQ REQ
        WHERE REQ.KEY_ID = 117
          AND REQ.REQ_STAT_CD = 'APR'
    )
    GROUP BY SVC_ID
),

CNT AS (
    SELECT
        API.SVC_ID,
        COUNT(DISTINCT SUB.KEY_ID) SUB_COUNT
    FROM HCP_API_BASE API
    JOIN HCP_API_PUB PUB
        ON API.API_ID = PUB.API_ID
    LEFT JOIN HCP_API_SUB SUB
        ON PUB.PUB_ID = SUB.PUB_ID
    WHERE API.SHOW_YN = 'Y'
      AND SUB.SUB_STAT_CD = 'NOR'
    GROUP BY API.SVC_ID
),

SUB AS (
    SELECT
        Z.SVC_ID,
        LISTAGG(Z.SUB_STAT_CD, ',')
            WITHIN GROUP (ORDER BY Z.SUB_STAT_CD)
            AS SUB_STAT_CD_STR
    FROM (
        SELECT
            API.SVC_ID,
            SUB.SUB_STAT_CD
        FROM HCP_API_BASE API
        JOIN HCP_API_PUB PUB
            ON API.API_ID = PUB.API_ID
        LEFT JOIN HCP_API_SUB SUB
            ON PUB.PUB_ID = SUB.PUB_ID
        WHERE API.SHOW_YN = 'Y'
          AND SUB.KEY_ID = 527
        GROUP BY API.SVC_ID,
                 SUB.SUB_STAT_CD
    ) Z
    GROUP BY Z.SVC_ID
)

SELECT *
FROM (
    SELECT
        SVC.SVC_ID,
        NVL(AUTH.AUTH_YN, 'NON') AS AUTH_YN,
        SVC.SVC_NM,
        SVC.SVC_DESC,
        SVC.SVC_TYPE,
        SVC.SVC_MODEL,
        SVC.REG_DTTM,
        SVC.UPD_DTTM,
        CAT.*,
        SVC.VW_CNT,
        SVC.AUTO_APPR,
        NVL(CNT.SUB_COUNT, 0) AS SUB_COUNT,

        CASE
            WHEN INSTR(SUB.SUB_STAT_CD_STR, 'APR') > 0 THEN 'APR'
            WHEN INSTR(SUB.SUB_STAT_CD_STR, 'NOR') > 0 THEN 'NOR'
            ELSE 'N'
        END AS SUB_STAT_CD

    FROM HCP_API_SVC SVC

    JOIN (
        SELECT
            CODE_ID AS CAT_ID,
            CODE_NM AS CAT_PATH,
            CODE_NM AS CAT_NM,
            HAC.NAME_KOR AS CAT_NAME_KO,
            HAC.NAME_ENG AS CAT_NAME_EN,
            HAC.NAME_CHN AS CAT_NAME_ZH
        FROM HCP_BASE_CODE HBC
        JOIN HCP_API_CODEDETAIL HAC
            ON HAC.CODE_CD = HBC.CODE_ID
           AND HAC.CODE_GRP_CD = 'STORE_CATE'
        WHERE HBC.CODE_CAT = 'HCP_API_CATEGORY'
          AND HBC.USE_YN = 'Y'
    ) CAT
        ON SVC.CAT_ID = CAT.CAT_ID

    LEFT JOIN CNT
        ON SVC.SVC_ID = CNT.SVC_ID

    LEFT JOIN SUB
        ON SVC.SVC_ID = SUB.SVC_ID

    LEFT JOIN AUTH
        ON SVC.SVC_ID = AUTH.SVC_ID

    WHERE SVC.SVC_ENV = 'DEV'
      AND SVC.SHOW_YN = 'Y'
      AND SVC.DEL_YN = 'N'

    ORDER BY SVC.SVC_ID DESC
) RESULT;
<Spin spinning={!isAuthorized || fetchLoading}>
            {isDrm && (
              <>
              <ContentHeader 
                $border={true}
                title="시스템 계정 사번"
                spacing={20}
              />
                <Division flex={true} gap={20} alignItems={'center'} mb={20}>
                  <Division.SubTitle>
                    DRM  서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
                  </Division.SubTitle>
                </Division>

                <Division flex={true} gap={10} alignItems={"center"}>
                  <input
                    value={drmEmpNo}
                    onChange={(e) => setDrmEmpNo(e.target.value)}
                    placeholder="예: X990001"
                    style={{
                      flex:1,
                      height: 36,
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      padding: "0 12px"
                    }} 
                  />
                  <Buttons.Basic
                    type={"primary"}
                    onClick={verifyDrmEmpNo}
                    disabled={drmStatus === "checking"}
                  >
                    {drmStatus === "checking" ? "확인 중..." : "유효성 확인"}
                  </Buttons.Basic>
                </Division>

                <Divide $border={false} top={10} bottom={0} />

                <div style={{fontSize: 13, opacity: 0.85}}>
                    {drmStatus === "valid" && "유효한 시스템 계정입니다."}
                    {drmStatus === "duplicated" && "이미 등록된 시스템 계정입니다."}
                    {drmStatus === "invalid" && "유효하지 않은 시스템 계정입니다."}
                    {drmStatus === "idle" && "사번 입력 후 '유효성 확인'을 눌러주세요"}
                </div>
              </>
            )}

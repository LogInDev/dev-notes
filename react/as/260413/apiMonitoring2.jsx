  // BarChart용 선택 변경 핸들러
  const handleBarChartChange = (selectedValues) => {
    if (selectedValues.length > 5) {
      setIsBarChartModalOpen(true);
      setBarChartConfirmMessage(
        intlObj.get(message['store.warning.maxSelectIs5']),
      );
      setBarChartTempSelected(selectedValues.slice(0, 5));
    } else {
      setBarChartTempSelected(selectedValues);
    }
  };

  // BarChart용 확인 버튼 핸들러
  const handleBarChartConfirm = () => {
    if (barChartTempSelected.length === 0) {
      setIsBarChartModalOpen(true);
      setBarChartConfirmMessage(
        intlObj.get(message['store.validation.selectAtLeastOne']),
      );
      return;
    } else {
      setBarChartSelected(barChartTempSelected);
      toggleBarChartDropdown();
    }
  };

  // BarChart용 취소 버튼 핸들러
  const handleBarChartCancel = () => {
    setBarChartTempSelected(barChartSelected);
    setIsBarChartModalOpen(false);
    toggleBarChartDropdown();
  };

  // BarChart용 날짜 변경 핸들러
  const handleBarChartDateChange = (dates) => {
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates;
      setBarChartDateRange({
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
      });
    }
  };

  // BarChart용 최상위 API 선택 핸들러
  const handleBarChartCallTopBtnClick = () => {
    const sortedApis = [...apiRankList]
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 5);
    const topApiValues = sortedApis.map(
      (api) => `${upperCase(api.method) || ''}:${api.apiUrl}`,
    );
    setBarChartSelected(topApiValues);
    setBarChartTempSelected(topApiValues);
    toggleBarChartDropdown();
  };

  // Scatter Chart용 최상위 API 선택 핸들러
  const handleScatterChartCallTopBtnClick = () => {
    const sortedApis = [...apiRankList]
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 5);
    const topApiValues = sortedApis.map(
      (api) => `${upperCase(api.method) || ''}:${api.apiUrl}`,
    );
    setScatterChartSelected(topApiValues);
    setScatterChartTempSelected(topApiValues);
    toggleScatterChartDropdown();
  };

  // Scatter Chart용 선택 변경 핸들러
  const handleScatterChartChange = (selectedValues) => {
    if (selectedValues.length > 5) {
      setIsModalOpen(true);
      setConfirmMessage(intlObj.get(message['store.warning.maxSelectIs5']));
      setScatterChartTempSelected(selectedValues.slice(0, 5));
    } else {
      setScatterChartTempSelected(selectedValues);
    }
  };

  // Scatter Chart용 확인 핸들러
  const handleScatterChartConfirm = () => {
    if (scatterChartTempSelected.length === 0) {
      setIsModalOpen(true);
      setConfirmMessage(
        intlObj.get(message['store.validation.selectAtLeastOne']),
      );
      return;
    } else {
      setScatterChartSelected([...scatterChartTempSelected]);
      toggleScatterChartDropdown();
    }
  };

  // Scatter Chart용 취소 핸들러
  const handleScatterChartCancel = () => {
    setScatterChartTempSelected(scatterChartSelected);
    setIsBarChartModalOpen(false);
    toggleScatterChartDropdown();
  };

  // Scatter Chart용 검색 변경 핸들러
  const handleScatterChartSearchChange = (e) => {
    setScatterChartSearchTerm(e.target.value);
  };

  // Scatter Chart용 날짜 변경 핸들러
  const handleScatterChartDateChange = (dates) => {
    const [startDate, endDate] = dates;
    setScatterChartDateRange({
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
    });
  };

  // 테이블 필터 조건 변경 시 핸들링
  const handleChangeTableFilter = (filters, action) => {
    if (action.action === 'filter') {
      setTableFilter(filters);
    }
  };

  // 테이블 정렬 변경 시 핸들링
  const handleChangeTableSoter = (sorter, action) => {
    if (action.action === 'sort') {
      setTableSorter({
        sort:
          sorter.order === 'ascend'
            ? 'ASC'
            : sorter.order === 'descend'
              ? 'DESC'
              : null,
        sortField: sorter.order ? sorter.column.key : null,
      });
    }
  };

  //대시보드 동적 설정
  const getDashboardData = () => {
    switch (selectedChartType) {
      case 'callCnt':
        return {
          userCnt: dashState.userCnt || 0,
          callCnt: dashState.callCnt || 0,
          avgTime: dashState.avgTime || 0,
          errorCnt: dashState.errorCnt || 0,
        };
      case 'errorCnt':
        return {
          userCnt: dashState.userCnt || 0,
          callCnt: dashState.callCnt || 0,
          avgTime: dashState.avgTime || 0,
          errorCnt: dashState.errorCnt || 0,
        };
      case 'respCnt':
        return {
          userCnt: dashState.userCnt || 0,
          callCnt: dashState.callCnt || 0,
          avgTime: dashState.avgTime || 0,
          errorCnt: dashState.errorCnt || 0,
        };
      default:
        return {
          userCnt: 0,
          callCnt: 0,
          avgTime: 0,
          errorCnt: 0,
        };
    }
  };

  const dashboardData = getDashboardData();

  //테이블 동적 설정
  const getTableData = () => {
    switch (selectedChartType) {
      case 'callCnt':
        return apiRes;
      case 'errorCnt':
        return apiRes;
      case 'respCnt':
        return apiRes;
      default:
        return [];
    }
  };

  const tableData = getTableData();

  const tableColumn = [
    {
      title: intlObj.get(message['store.project']),
      dataIndex: 'prjId',
      width: '15%',
      resize: true,
      align: 'center',
      ellipsis: true,
    },
    {
      title: intlObj.get(message['store.apiReqTime']),
      key: 'timestamp',
      dataIndex: 'timestamp',
      width: '15%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: true,
      sortDirections: ['ascend', 'descend', null],
      render: (text) => {
        if (text) {
          const date = new Date(text);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
          return '-';
        }
      },
    },
    {
      title: intlObj.get(message['store.keyName']),
      dataIndex: 'keyName',
      width: '13%',
      resize: true,
      align: 'center',
      ellipsis: true,
    },
    {
      title: intlObj.get(message['store.keyType']),
      dataIndex: 'authCd',
      width: '7%',
      resize: true,
      align: 'center',
      ellipsis: true,
      render: (text, record) => {
        const keyType =
          record?.authCd === 'SYS'
            ? intlObj.get(message['store.system'])
            : record?.authCd === 'PSN'
              ? intlObj.get(message['store.personal'])
              : undefined;
        return keyType;
      },
    },
    {
      title: intlObj.get(message['store.keyConnectionInfo']),
      width: '11%',
      resize: true,
      align: 'center',
      ellipsis: true,
      render: (text, record) => {
        const keyOwnerName = record?.keyOwnerName;
        const keyOWnerId = record?.keyOwnerId;
        const systemName = record?.appNm;

        return record?.authCd === 'PSN'
          ? `${keyOwnerName} (${keyOWnerId})`
          : record?.authCd === 'SYS'
            ? systemName
            : '-';
      },
    },
    {
      title: intlObj.get(message['store.statusCode']),
      dataIndex: 'responseCode',
      width: '10%',
      resize: true,
      align: 'center',
      ellipsis: true,
      render: (text) => text || '-',
      filters: [...responseCode]
        .sort((a, b) => {
          // 숫자 순으로 정렬
          return a - b;
        })
        .map((code) => ({
          text: code,
          value: code,
        })),
    },
    {
      title: 'API',
      key: 'apiPath.keyword',
      dataIndex: 'api',
      width: '22%',
      resize: true,
      ellipsis: true,
      showSorterTooltip: false,
      sorter: true,
      sortDirections: ['ascend', 'descend', null],
      render: (text, record) => {
        return `(${record.method}) ${text}`;
      },
    },
    {
      title: intlObj.get(message['store.responseTime']),
      key: 'responseTime',
      dataIndex: 'responseTime',
      width: '7%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: true,
      sortDirections: ['ascend', 'descend', null],
      render: (text) => (text ? `${formatNumberWithComma(text)} ms` : '-'),
    },
  ];

  // 모달에서 선택된 키를 부모 컴포넌트로 전달
  const handleKeySelect = (selectedData) => {
    if (selectedData) {
      setApiInfo((prev) => ({
        ...prev,
        keyId: selectedData.keyId,
        keyName: selectedData.keyName,
      }));
    }
    setOpenKeyPopup(false);
  };

  const handleCallTopBtnClick = () => {
    const sortedApis = [...apiRankList]
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 5);
    const topApiValues = sortedApis.map(
      (api) => `${upperCase(api.method) || ''}:${api.apiUrl}`,
    );
    setSelectedOptions(topApiValues);
    setTempSelectedOptions(topApiValues);
    toggleDropdown();
  };

  const getOptionsForChartType = () => {
    if (!apiRankList || apiRankList.length === 0) {
      return []; // apiRankList가 없거나 비어있으면 빈 배열 반환
    }

    switch (selectedChartType) {
      case 'callCnt':
        return apiRankList.map((api) => ({
          value: `${upperCase(api.method) || ''}:${api.apiUrl}`,
          label: `(${upperCase(api.method) || ''}) ${api.apiUrl}`,
        }));

      case 'errorCnt':
        return apiRankList.map((api) => ({
          value: `${upperCase(api.method) || ''}:${api.apiUrl}`,
          label: `(${upperCase(api.method) || ''}) ${api.apiUrl}`,
        }));
      case 'respCnt':
        return apiRankList.map((api) => ({
          value: `${upperCase(api.method) || ''}:${api.apiUrl}`,
          label: `(${upperCase(api.method) || ''}) ${api.apiUrl}`,
        }));
      default:
        return [];
    }
  };

  return (
    <>
      <Division flex={true} gap={10}>
        <Select
          width={150}
          placeholder={intlObj.get(message['store.callCount'])}
          defaultValue={'callCnt'}
          options={firstOptions}
          onChange={handleChartTypeChange}
        />
        {/* 차트 타입에 따른 선택 영역 */}
        {selectedChartType === 'callCnt' && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CustomSelect
              placeholder={'API Call best top 5'}
              options={getOptionsForChartType()}
              value={tempSelectedOptions}
              onChange={handleChange}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              isOpen={isDropdownOpen}
              toggleDropdown={toggleDropdown}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              handleCallTopBtnClick={handleCallTopBtnClick}
            />
          </div>
        )}
        {selectedChartType === 'errorCnt' && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CustomSelect
              placeholder={'API Call best top 5'}
              options={getOptionsForChartType()}
              value={barChartTempSelected}
              onChange={handleBarChartChange}
              onConfirm={handleBarChartConfirm}
              onCancel={handleBarChartCancel}
              isOpen={isBarChartDropdownOpen}
              toggleDropdown={toggleBarChartDropdown}
              searchTerm={barChartSearchTerm}
              handleSearchChange={handleBarChartSearchChange}
              handleCallTopBtnClick={handleBarChartCallTopBtnClick}
            />
          </div>
        )}
        {selectedChartType === 'respCnt' && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CustomSelect
              placeholder={'API Call best top 5'}
              options={getOptionsForChartType()}
              value={scatterChartTempSelected}
              onChange={handleScatterChartChange}
              onConfirm={handleScatterChartConfirm}
              onCancel={handleScatterChartCancel}
              isOpen={isScatterChartDropdownOpen}
              toggleDropdown={toggleScatterChartDropdown}
              searchTerm={scatterChartSearchTerm}
              handleSearchChange={handleScatterChartSearchChange}
              handleCallTopBtnClick={handleScatterChartCallTopBtnClick}
            />
          </div>
        )}
        {/* 차트 타입에 따른 날짜 선택기 */}
        {selectedChartType === 'callCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(lineChartDateRange.startDate),
              dayjs(lineChartDateRange.endDate),
            ]}
            onChange={handleDateChange}
            allowClear={false}
          />
        )}
        {selectedChartType === 'errorCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(barChartDateRange.startDate),
              dayjs(barChartDateRange.endDate),
            ]}
            onChange={handleBarChartDateChange}
            allowClear={false}
          />
        )}
        {/* Scatter Chart용 날짜 선택기 */}
        {selectedChartType === 'respCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(scatterChartDateRange.startDate),
              dayjs(scatterChartDateRange.endDate),
            ]}
            onChange={handleScatterChartDateChange}
            allowClear={false}
          />
        )}
        {keyId !== 'REG' && (
          <span>
            <Selector
              onClick={handleOpenKeyPopup}
              placeholder={intlObj.get(message['store.selectKey'])}
              icon={'key'}
            >
              {keyName ? keyName : []}
            </Selector>
          </span>
        )}
      </Division>
      <div style={{ marginBottom: '20px' }}>
        {selectedChartType === 'callCnt' ? (
          <LineChart
            startDate={lineChartDateRange.startDate}
            endDate={lineChartDateRange.endDate}
            apiUrl={selectedOptions}
          />
        ) : selectedChartType === 'errorCnt' ? (
          <BarChart
            startDate={barChartDateRange.startDate}
            endDate={barChartDateRange.endDate}
            apiUrl={barChartSelected}
          />
        ) : (
          <ScatterChart
            startDate={scatterChartDateRange.startDate}
            endDate={scatterChartDateRange.endDate}
            apiUrl={scatterChartSelected}
          />
        )}
      </div>
      <Spin spinning={dashLoading}>
        <Division flex={true} gap={30}>
          <Dashboard
            iconSrc={icon_person}
            color={'#E7E8F8'}
            title={intlObj.get(message['store.userCount'])}
            count={formatNumberWithComma(dashboardData.userCnt)}
            className={'dash'}
            dashNumColor={'#333333'}
          />
          <Dashboard
            iconSrc={icon_cpm_api}
            color={'#F1F7FF'}
            title={intlObj.get(message['store.apiCallCount'])}
            count={formatNumberWithComma(dashboardData.callCnt)}
            className={'dash'}
            dashNumColor={'#333333'}
          />
          <Dashboard
            iconSrc={icon_time}
            color={'#F1F7FF'}
            title={intlObj.get(message['store.averageResponseTime'])}
            count={formatNumberWithComma(dashboardData.avgTime)}
            unit={dashboardData.avgTime !== 0 ? 'ms' : undefined}
            className={'dash'}
            dashNumColor={'#333333'}
          />
          <Dashboard
            iconSrc={icon_error}
            color={'#FFF5F5'}
            title={intlObj.get(message['store.errorCount'])}
            count={formatNumberWithComma(dashboardData.errorCnt)}
            className={'dash'}
            dashNumColor={'#FF0016'}
          />
        </Division>
      </Spin>
      <Division mt={40}>
        <Table
          loading={fetchApiResListLoading}
          columns={tableColumn}
          dataSource={tableData}
          type={'normal'}
          pagination={{
            position: ['bottomCenter'],
            showAllItems: true,
            total,
            pageSize,
            current: pageNum,
            onChange: (pageNum) => setPageNum(pageNum),
          }}
          paginationExtraContent={
            <Select
              value={pageSize}
              options={pageSizeOptions}
              onSelect={(_, value) => setPageSize(value.value)}
            />
          }
          onChange={(pagination, filters, sorter, action) => {
            handleChangeTableFilter(filters, action);
            handleChangeTableSoter(sorter, action);
          }}
          scroll={{ y: 500 }}
        />
      </Division>
      <Confirm
        open={isModalOpen}
        title={intlObj.get(message['store.alert'])}
        desc={confirmMessage}
        okText={intlObj.get(message['store.ok'])}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        hideCancel={true}
      />
      {selectedChartType === 'errorCnt' && (
        <Confirm
          open={isBarChartModalOpen}
          title={intlObj.get(message['store.alert'])}
          desc={barChartConfirmMessage}
          okText={intlObj.get(message['store.ok'])}
          onOk={() => setIsBarChartModalOpen(false)}
          onCancel={() => setIsBarChartModalOpen(false)}
          hideCancel={true}
        />
      )}
      <DashKeyModal
        open={openKeyPopup}
        onOk={handleKeySelect}
        onCancel={() => setOpenKeyPopup(false)}
        value={selectedKey}
        svcId={svcId}
        keyId={keyId}
      />
    </>
  );
};

export default ApiMonitoring;

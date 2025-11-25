
  uploadCDN(fileData, empNo) {
    const formData = new FormData();
    formData.append('files', fileData, fileData.name);
    formData.append('key', this.getCDNInfo().cdn_key);
    formData.append('empNo', empNo);

    Log.debug('[' + url + '](send) : ', formData);

    let _urlBase = this.getCDNInfo().cdn_root;
    let url = "/api/pub/v1/upload";

    return new Promise(function (resolve, reject) {
      jquery.ajax({
        url: _urlBase + url,
        data: formData,
        type: 'post',
        contentType: false,
        processData: false,
        success: function (res) {
          Log.debug('[addr : ' + url + '](receive) : ', res);
          const _res = { ...res, url: _urlBase };
          resolve(_res);
        },
        error: function (err) {
          Log.debug('[addr : ' + url + '](error) : ', err);
          reject(err);
        },
      });
    });
  }

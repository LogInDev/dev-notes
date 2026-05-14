useEffect(() => {
  const nextData = produce(parameters, (draft) => {
    for (let i = draft.length - 1; i >= 0; i--) {
      if (
        draft[i]?.in !== 'header' &&
        draft[i]?.in !== 'path' &&
        draft[i]?.in !== 'query'
      ) {
        draft.splice(i, 1);
      }
    }

    for (const parameter of draft) {
      parameter.originExample = parameter.example ?? '';

      if (parameter?.schema?.type === 'array') {
        parameter.example = JSON.stringify(parameter?.example);
        parameter.originExample = parameter.example;
      } else if (parameter?.schema?.type === 'object') {
        parameter.example = JSON.stringify(parameter?.example, null, 2);
        parameter.originExample = parameter.example;
      }
    }

    const order = { header: 0, path: 1, query: 2 };
    draft.sort((a, b) => order[a.in] - order[b.in]);
  });

  setParametersState(nextData);
}, [parameters]);

useEffect(() => {
  setParametersState((prev) =>
    produce(prev, (draft) => {
      draft.forEach((p) => {
        const type = p?.type || p?.schema?.type;

        if (
          p?.in === 'header' &&
          type === 'string' &&
          p?.name?.toLowerCase() === 'meta'
        ) {
          p.example = executeMode
            ? axios.defaults.headers.common?.META || ''
            : p?.originExample ?? '';
        }
      });
    }),
  );
}, [executeMode]);
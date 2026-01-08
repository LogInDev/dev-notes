this.setState(
      (prev) => {
        const exists = prev.openPopups.indexOf(id) >= 0;
        const nextOpenPopups = exists
          ? prev.openPopups
          : prev.openPopups.concat(id);

        return {
          openPopups: nextOpenPopups,
          currentId: id,
        };
      },
      () => {
        // ✅ 여기서 확인
        console.log('★ setState 후 openPopups:', this.state.openPopups);
      }
    );

    if (this.props
    
    
    
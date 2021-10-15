const postOrganizer = (postArr) => {
  const mapped = postArr
    //convert posts to what only info we want
    .map((post) => post.dataValues)
    //add id's of all children to new 'children' array
    .map((post) => {
      return {
        ...post,
        children: postArr
          .filter((p) => post.id === p.childOf)
          .map((po) => po.id),
      };
    })
    // sort by id, highest to lowest
    // newer posts will always have higher id, we want to hash those first
    .sort((a, b) => b.id - a.id);

  // create a hashtable to store post information
  const hash = mapped.reduce((a, b) => {
    a[b.id] = { ...b };
    return a;
  }, {});

  mapped.forEach((post) => {
    //update children array to reflect the children's maps
    post.children = post.children.map((child) => hash[child]);
    //update hash for this post
    hash[post.id] = post;
  });
  
  //top level posts only
  return mapped.filter((p) => !p.childOf);
};

module.exports = postOrganizer;

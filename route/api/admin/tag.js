/**
 * Created by bangbang93 on 2017/9/5.
 */
'use strict'
/* eslint-disable @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
const router = require('express-promise-router')()
const AdminTagService = require('../../../service/admin/tag')

router.get('/', async (req, res) => {
  const tags = await AdminTagService.listAll()
  res.json(tags)
})

router.put('/:title', async (req, res) => {
  const title = req.params.title
  const tag = await AdminTagService.createIfNotExists(title)
  if (tag.isNew) {
    res.status(201)
  }
  res.json(tag)
})

module.exports = router

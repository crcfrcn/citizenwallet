// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wallet_isar.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetWalletEntityCollection on Isar {
  IsarCollection<WalletEntity> get walletEntitys => this.collection();
}

const WalletEntitySchema = CollectionSchema(
  name: r'wallet',
  id: -6454414953177932508,
  properties: {
    r'master_id': PropertySchema(
      id: 0,
      name: r'master_id',
      type: IsarType.string,
    ),
    r'sort_order': PropertySchema(
      id: 1,
      name: r'sort_order',
      type: IsarType.long,
    ),
    r'wallet_index': PropertySchema(
      id: 2,
      name: r'wallet_index',
      type: IsarType.long,
    ),
    r'wallet_name': PropertySchema(
      id: 3,
      name: r'wallet_name',
      type: IsarType.string,
    )
  },
  estimateSize: _walletEntityEstimateSize,
  serialize: _walletEntitySerialize,
  deserialize: _walletEntityDeserialize,
  deserializeProp: _walletEntityDeserializeProp,
  idName: r'row_id',
  indexes: {
    r'wallet_index': IndexSchema(
      id: -1236870029081474889,
      name: r'wallet_index',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'wallet_index',
          type: IndexType.value,
          caseSensitive: false,
        )
      ],
    ),
    r'master_id': IndexSchema(
      id: -7205393036650813153,
      name: r'master_id',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'master_id',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _walletEntityGetId,
  getLinks: _walletEntityGetLinks,
  attach: _walletEntityAttach,
  version: '3.3.2',
);

int _walletEntityEstimateSize(
  WalletEntity object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.masterId.length * 3;
  bytesCount += 3 + object.walletName.length * 3;
  return bytesCount;
}

void _walletEntitySerialize(
  WalletEntity object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.masterId);
  writer.writeLong(offsets[1], object.sortOrder);
  writer.writeLong(offsets[2], object.walletIndex);
  writer.writeString(offsets[3], object.walletName);
}

WalletEntity _walletEntityDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = WalletEntity();
  object.masterId = reader.readString(offsets[0]);
  object.id = id;
  object.sortOrder = reader.readLong(offsets[1]);
  object.walletIndex = reader.readLong(offsets[2]);
  object.walletName = reader.readString(offsets[3]);
  return object;
}

P _walletEntityDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readLong(offset)) as P;
    case 2:
      return (reader.readLong(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _walletEntityGetId(WalletEntity object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _walletEntityGetLinks(WalletEntity object) {
  return [];
}

void _walletEntityAttach(
    IsarCollection<dynamic> col, Id id, WalletEntity object) {
  object.id = id;
}

extension WalletEntityByIndex on IsarCollection<WalletEntity> {
  Future<WalletEntity?> getByWalletIndex(int walletIndex) {
    return getByIndex(r'wallet_index', [walletIndex]);
  }

  WalletEntity? getByWalletIndexSync(int walletIndex) {
    return getByIndexSync(r'wallet_index', [walletIndex]);
  }

  Future<bool> deleteByWalletIndex(int walletIndex) {
    return deleteByIndex(r'wallet_index', [walletIndex]);
  }

  bool deleteByWalletIndexSync(int walletIndex) {
    return deleteByIndexSync(r'wallet_index', [walletIndex]);
  }

  Future<List<WalletEntity?>> getAllByWalletIndex(List<int> walletIndexValues) {
    final values = walletIndexValues.map((e) => [e]).toList();
    return getAllByIndex(r'wallet_index', values);
  }

  List<WalletEntity?> getAllByWalletIndexSync(List<int> walletIndexValues) {
    final values = walletIndexValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'wallet_index', values);
  }

  Future<int> deleteAllByWalletIndex(List<int> walletIndexValues) {
    final values = walletIndexValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'wallet_index', values);
  }

  int deleteAllByWalletIndexSync(List<int> walletIndexValues) {
    final values = walletIndexValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'wallet_index', values);
  }

  Future<Id> putByWalletIndex(WalletEntity object) {
    return putByIndex(r'wallet_index', object);
  }

  Id putByWalletIndexSync(WalletEntity object, {bool saveLinks = true}) {
    return putByIndexSync(r'wallet_index', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByWalletIndex(List<WalletEntity> objects) {
    return putAllByIndex(r'wallet_index', objects);
  }

  List<Id> putAllByWalletIndexSync(List<WalletEntity> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'wallet_index', objects, saveLinks: saveLinks);
  }

  Future<WalletEntity?> getByMasterId(String masterId) {
    return getByIndex(r'master_id', [masterId]);
  }

  WalletEntity? getByMasterIdSync(String masterId) {
    return getByIndexSync(r'master_id', [masterId]);
  }

  Future<bool> deleteByMasterId(String masterId) {
    return deleteByIndex(r'master_id', [masterId]);
  }

  bool deleteByMasterIdSync(String masterId) {
    return deleteByIndexSync(r'master_id', [masterId]);
  }

  Future<List<WalletEntity?>> getAllByMasterId(List<String> masterIdValues) {
    final values = masterIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'master_id', values);
  }

  List<WalletEntity?> getAllByMasterIdSync(List<String> masterIdValues) {
    final values = masterIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'master_id', values);
  }

  Future<int> deleteAllByMasterId(List<String> masterIdValues) {
    final values = masterIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'master_id', values);
  }

  int deleteAllByMasterIdSync(List<String> masterIdValues) {
    final values = masterIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'master_id', values);
  }

  Future<Id> putByMasterId(WalletEntity object) {
    return putByIndex(r'master_id', object);
  }

  Id putByMasterIdSync(WalletEntity object, {bool saveLinks = true}) {
    return putByIndexSync(r'master_id', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByMasterId(List<WalletEntity> objects) {
    return putAllByIndex(r'master_id', objects);
  }

  List<Id> putAllByMasterIdSync(List<WalletEntity> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'master_id', objects, saveLinks: saveLinks);
  }
}

extension WalletEntityQueryWhereSort
    on QueryBuilder<WalletEntity, WalletEntity, QWhere> {
  QueryBuilder<WalletEntity, WalletEntity, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhere> anyWalletIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'wallet_index'),
      );
    });
  }
}

extension WalletEntityQueryWhere
    on QueryBuilder<WalletEntity, WalletEntity, QWhereClause> {
  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause> idNotEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause> idGreaterThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause>
      walletIndexEqualTo(int walletIndex) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'wallet_index',
        value: [walletIndex],
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause>
      walletIndexNotEqualTo(int walletIndex) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'wallet_index',
              lower: [],
              upper: [walletIndex],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'wallet_index',
              lower: [walletIndex],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'wallet_index',
              lower: [walletIndex],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'wallet_index',
              lower: [],
              upper: [walletIndex],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause>
      walletIndexGreaterThan(
    int walletIndex, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'wallet_index',
        lower: [walletIndex],
        includeLower: include,
        upper: [],
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause>
      walletIndexLessThan(
    int walletIndex, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'wallet_index',
        lower: [],
        upper: [walletIndex],
        includeUpper: include,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause>
      walletIndexBetween(
    int lowerWalletIndex,
    int upperWalletIndex, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'wallet_index',
        lower: [lowerWalletIndex],
        includeLower: includeLower,
        upper: [upperWalletIndex],
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause> masterIdEqualTo(
      String masterId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'master_id',
        value: [masterId],
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterWhereClause>
      masterIdNotEqualTo(String masterId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id',
              lower: [],
              upper: [masterId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id',
              lower: [masterId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id',
              lower: [masterId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id',
              lower: [],
              upper: [masterId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension WalletEntityQueryFilter
    on QueryBuilder<WalletEntity, WalletEntity, QFilterCondition> {
  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'master_id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'master_id',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'master_id',
        value: '',
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      masterIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'master_id',
        value: '',
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'row_id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      sortOrderEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sort_order',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      sortOrderGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'sort_order',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      sortOrderLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'sort_order',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      sortOrderBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'sort_order',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletIndexEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'wallet_index',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletIndexGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'wallet_index',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletIndexLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'wallet_index',
        value: value,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletIndexBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'wallet_index',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'wallet_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'wallet_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'wallet_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'wallet_name',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'wallet_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'wallet_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'wallet_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'wallet_name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'wallet_name',
        value: '',
      ));
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterFilterCondition>
      walletNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'wallet_name',
        value: '',
      ));
    });
  }
}

extension WalletEntityQueryObject
    on QueryBuilder<WalletEntity, WalletEntity, QFilterCondition> {}

extension WalletEntityQueryLinks
    on QueryBuilder<WalletEntity, WalletEntity, QFilterCondition> {}

extension WalletEntityQuerySortBy
    on QueryBuilder<WalletEntity, WalletEntity, QSortBy> {
  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> sortByMasterId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> sortByMasterIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.desc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> sortBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sort_order', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> sortBySortOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sort_order', Sort.desc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> sortByWalletIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_index', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy>
      sortByWalletIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_index', Sort.desc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> sortByWalletName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_name', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy>
      sortByWalletNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_name', Sort.desc);
    });
  }
}

extension WalletEntityQuerySortThenBy
    on QueryBuilder<WalletEntity, WalletEntity, QSortThenBy> {
  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenByMasterId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenByMasterIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.desc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'row_id', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'row_id', Sort.desc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sort_order', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenBySortOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sort_order', Sort.desc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenByWalletIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_index', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy>
      thenByWalletIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_index', Sort.desc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy> thenByWalletName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_name', Sort.asc);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QAfterSortBy>
      thenByWalletNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'wallet_name', Sort.desc);
    });
  }
}

extension WalletEntityQueryWhereDistinct
    on QueryBuilder<WalletEntity, WalletEntity, QDistinct> {
  QueryBuilder<WalletEntity, WalletEntity, QDistinct> distinctByMasterId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'master_id', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QDistinct> distinctBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sort_order');
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QDistinct> distinctByWalletIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'wallet_index');
    });
  }

  QueryBuilder<WalletEntity, WalletEntity, QDistinct> distinctByWalletName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'wallet_name', caseSensitive: caseSensitive);
    });
  }
}

extension WalletEntityQueryProperty
    on QueryBuilder<WalletEntity, WalletEntity, QQueryProperty> {
  QueryBuilder<WalletEntity, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'row_id');
    });
  }

  QueryBuilder<WalletEntity, String, QQueryOperations> masterIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'master_id');
    });
  }

  QueryBuilder<WalletEntity, int, QQueryOperations> sortOrderProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sort_order');
    });
  }

  QueryBuilder<WalletEntity, int, QQueryOperations> walletIndexProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'wallet_index');
    });
  }

  QueryBuilder<WalletEntity, String, QQueryOperations> walletNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'wallet_name');
    });
  }
}

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetAccountEntityCollection on Isar {
  IsarCollection<AccountEntity> get accountEntitys => this.collection();
}

const AccountEntitySchema = CollectionSchema(
  name: r'account',
  id: -5827943236100964141,
  properties: {
    r'account_id': PropertySchema(
      id: 0,
      name: r'account_id',
      type: IsarType.string,
    ),
    r'account_index': PropertySchema(
      id: 1,
      name: r'account_index',
      type: IsarType.long,
    ),
    r'account_name': PropertySchema(
      id: 2,
      name: r'account_name',
      type: IsarType.string,
    ),
    r'master_id': PropertySchema(
      id: 3,
      name: r'master_id',
      type: IsarType.string,
    )
  },
  estimateSize: _accountEntityEstimateSize,
  serialize: _accountEntitySerialize,
  deserialize: _accountEntityDeserialize,
  deserializeProp: _accountEntityDeserializeProp,
  idName: r'row_id',
  indexes: {
    r'master_id_account_index': IndexSchema(
      id: 4155264467274436237,
      name: r'master_id_account_index',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'master_id',
          type: IndexType.hash,
          caseSensitive: true,
        ),
        IndexPropertySchema(
          name: r'account_index',
          type: IndexType.value,
          caseSensitive: false,
        )
      ],
    ),
    r'account_id': IndexSchema(
      id: 3848080515527097000,
      name: r'account_id',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'account_id',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _accountEntityGetId,
  getLinks: _accountEntityGetLinks,
  attach: _accountEntityAttach,
  version: '3.3.2',
);

int _accountEntityEstimateSize(
  AccountEntity object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.accountId.length * 3;
  bytesCount += 3 + object.accountName.length * 3;
  bytesCount += 3 + object.masterId.length * 3;
  return bytesCount;
}

void _accountEntitySerialize(
  AccountEntity object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.accountId);
  writer.writeLong(offsets[1], object.accountIndex);
  writer.writeString(offsets[2], object.accountName);
  writer.writeString(offsets[3], object.masterId);
}

AccountEntity _accountEntityDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = AccountEntity();
  object.accountId = reader.readString(offsets[0]);
  object.accountIndex = reader.readLong(offsets[1]);
  object.accountName = reader.readString(offsets[2]);
  object.masterId = reader.readString(offsets[3]);
  object.id = id;
  return object;
}

P _accountEntityDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readLong(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _accountEntityGetId(AccountEntity object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _accountEntityGetLinks(AccountEntity object) {
  return [];
}

void _accountEntityAttach(
    IsarCollection<dynamic> col, Id id, AccountEntity object) {
  object.id = id;
}

extension AccountEntityByIndex on IsarCollection<AccountEntity> {
  Future<AccountEntity?> getByMasterIdAccountIndex(
      String masterId, int accountIndex) {
    return getByIndex(r'master_id_account_index', [masterId, accountIndex]);
  }

  AccountEntity? getByMasterIdAccountIndexSync(
      String masterId, int accountIndex) {
    return getByIndexSync(r'master_id_account_index', [masterId, accountIndex]);
  }

  Future<bool> deleteByMasterIdAccountIndex(String masterId, int accountIndex) {
    return deleteByIndex(r'master_id_account_index', [masterId, accountIndex]);
  }

  bool deleteByMasterIdAccountIndexSync(String masterId, int accountIndex) {
    return deleteByIndexSync(
        r'master_id_account_index', [masterId, accountIndex]);
  }

  Future<List<AccountEntity?>> getAllByMasterIdAccountIndex(
      List<String> masterIdValues, List<int> accountIndexValues) {
    final len = masterIdValues.length;
    assert(accountIndexValues.length == len,
        'All index values must have the same length');
    final values = <List<dynamic>>[];
    for (var i = 0; i < len; i++) {
      values.add([masterIdValues[i], accountIndexValues[i]]);
    }

    return getAllByIndex(r'master_id_account_index', values);
  }

  List<AccountEntity?> getAllByMasterIdAccountIndexSync(
      List<String> masterIdValues, List<int> accountIndexValues) {
    final len = masterIdValues.length;
    assert(accountIndexValues.length == len,
        'All index values must have the same length');
    final values = <List<dynamic>>[];
    for (var i = 0; i < len; i++) {
      values.add([masterIdValues[i], accountIndexValues[i]]);
    }

    return getAllByIndexSync(r'master_id_account_index', values);
  }

  Future<int> deleteAllByMasterIdAccountIndex(
      List<String> masterIdValues, List<int> accountIndexValues) {
    final len = masterIdValues.length;
    assert(accountIndexValues.length == len,
        'All index values must have the same length');
    final values = <List<dynamic>>[];
    for (var i = 0; i < len; i++) {
      values.add([masterIdValues[i], accountIndexValues[i]]);
    }

    return deleteAllByIndex(r'master_id_account_index', values);
  }

  int deleteAllByMasterIdAccountIndexSync(
      List<String> masterIdValues, List<int> accountIndexValues) {
    final len = masterIdValues.length;
    assert(accountIndexValues.length == len,
        'All index values must have the same length');
    final values = <List<dynamic>>[];
    for (var i = 0; i < len; i++) {
      values.add([masterIdValues[i], accountIndexValues[i]]);
    }

    return deleteAllByIndexSync(r'master_id_account_index', values);
  }

  Future<Id> putByMasterIdAccountIndex(AccountEntity object) {
    return putByIndex(r'master_id_account_index', object);
  }

  Id putByMasterIdAccountIndexSync(AccountEntity object,
      {bool saveLinks = true}) {
    return putByIndexSync(r'master_id_account_index', object,
        saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByMasterIdAccountIndex(List<AccountEntity> objects) {
    return putAllByIndex(r'master_id_account_index', objects);
  }

  List<Id> putAllByMasterIdAccountIndexSync(List<AccountEntity> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'master_id_account_index', objects,
        saveLinks: saveLinks);
  }

  Future<AccountEntity?> getByAccountId(String accountId) {
    return getByIndex(r'account_id', [accountId]);
  }

  AccountEntity? getByAccountIdSync(String accountId) {
    return getByIndexSync(r'account_id', [accountId]);
  }

  Future<bool> deleteByAccountId(String accountId) {
    return deleteByIndex(r'account_id', [accountId]);
  }

  bool deleteByAccountIdSync(String accountId) {
    return deleteByIndexSync(r'account_id', [accountId]);
  }

  Future<List<AccountEntity?>> getAllByAccountId(List<String> accountIdValues) {
    final values = accountIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'account_id', values);
  }

  List<AccountEntity?> getAllByAccountIdSync(List<String> accountIdValues) {
    final values = accountIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'account_id', values);
  }

  Future<int> deleteAllByAccountId(List<String> accountIdValues) {
    final values = accountIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'account_id', values);
  }

  int deleteAllByAccountIdSync(List<String> accountIdValues) {
    final values = accountIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'account_id', values);
  }

  Future<Id> putByAccountId(AccountEntity object) {
    return putByIndex(r'account_id', object);
  }

  Id putByAccountIdSync(AccountEntity object, {bool saveLinks = true}) {
    return putByIndexSync(r'account_id', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByAccountId(List<AccountEntity> objects) {
    return putAllByIndex(r'account_id', objects);
  }

  List<Id> putAllByAccountIdSync(List<AccountEntity> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'account_id', objects, saveLinks: saveLinks);
  }
}

extension AccountEntityQueryWhereSort
    on QueryBuilder<AccountEntity, AccountEntity, QWhere> {
  QueryBuilder<AccountEntity, AccountEntity, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension AccountEntityQueryWhere
    on QueryBuilder<AccountEntity, AccountEntity, QWhereClause> {
  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause> idEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause> idNotEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause> idGreaterThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause> idLessThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      masterIdEqualToAnyAccountIndex(String masterId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'master_id_account_index',
        value: [masterId],
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      masterIdNotEqualToAnyAccountIndex(String masterId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [],
              upper: [masterId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [masterId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [masterId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [],
              upper: [masterId],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      masterIdAccountIndexEqualTo(String masterId, int accountIndex) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'master_id_account_index',
        value: [masterId, accountIndex],
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      masterIdEqualToAccountIndexNotEqualTo(String masterId, int accountIndex) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [masterId],
              upper: [masterId, accountIndex],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [masterId, accountIndex],
              includeLower: false,
              upper: [masterId],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [masterId, accountIndex],
              includeLower: false,
              upper: [masterId],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'master_id_account_index',
              lower: [masterId],
              upper: [masterId, accountIndex],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      masterIdEqualToAccountIndexGreaterThan(
    String masterId,
    int accountIndex, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'master_id_account_index',
        lower: [masterId, accountIndex],
        includeLower: include,
        upper: [masterId],
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      masterIdEqualToAccountIndexLessThan(
    String masterId,
    int accountIndex, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'master_id_account_index',
        lower: [masterId],
        upper: [masterId, accountIndex],
        includeUpper: include,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      masterIdEqualToAccountIndexBetween(
    String masterId,
    int lowerAccountIndex,
    int upperAccountIndex, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'master_id_account_index',
        lower: [masterId, lowerAccountIndex],
        includeLower: includeLower,
        upper: [masterId, upperAccountIndex],
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      accountIdEqualTo(String accountId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'account_id',
        value: [accountId],
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterWhereClause>
      accountIdNotEqualTo(String accountId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'account_id',
              lower: [],
              upper: [accountId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'account_id',
              lower: [accountId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'account_id',
              lower: [accountId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'account_id',
              lower: [],
              upper: [accountId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension AccountEntityQueryFilter
    on QueryBuilder<AccountEntity, AccountEntity, QFilterCondition> {
  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'account_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'account_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'account_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'account_id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'account_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'account_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'account_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'account_id',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'account_id',
        value: '',
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'account_id',
        value: '',
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIndexEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'account_index',
        value: value,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIndexGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'account_index',
        value: value,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIndexLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'account_index',
        value: value,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountIndexBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'account_index',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'account_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'account_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'account_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'account_name',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'account_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'account_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'account_name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'account_name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'account_name',
        value: '',
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      accountNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'account_name',
        value: '',
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'master_id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'master_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'master_id',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'master_id',
        value: '',
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      masterIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'master_id',
        value: '',
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition>
      idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'row_id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension AccountEntityQueryObject
    on QueryBuilder<AccountEntity, AccountEntity, QFilterCondition> {}

extension AccountEntityQueryLinks
    on QueryBuilder<AccountEntity, AccountEntity, QFilterCondition> {}

extension AccountEntityQuerySortBy
    on QueryBuilder<AccountEntity, AccountEntity, QSortBy> {
  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> sortByAccountId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_id', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      sortByAccountIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_id', Sort.desc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      sortByAccountIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_index', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      sortByAccountIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_index', Sort.desc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> sortByAccountName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_name', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      sortByAccountNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_name', Sort.desc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> sortByMasterId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      sortByMasterIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.desc);
    });
  }
}

extension AccountEntityQuerySortThenBy
    on QueryBuilder<AccountEntity, AccountEntity, QSortThenBy> {
  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> thenByAccountId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_id', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      thenByAccountIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_id', Sort.desc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      thenByAccountIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_index', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      thenByAccountIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_index', Sort.desc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> thenByAccountName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_name', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      thenByAccountNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'account_name', Sort.desc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> thenByMasterId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy>
      thenByMasterIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'master_id', Sort.desc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'row_id', Sort.asc);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'row_id', Sort.desc);
    });
  }
}

extension AccountEntityQueryWhereDistinct
    on QueryBuilder<AccountEntity, AccountEntity, QDistinct> {
  QueryBuilder<AccountEntity, AccountEntity, QDistinct> distinctByAccountId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'account_id', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QDistinct>
      distinctByAccountIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'account_index');
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QDistinct> distinctByAccountName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'account_name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<AccountEntity, AccountEntity, QDistinct> distinctByMasterId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'master_id', caseSensitive: caseSensitive);
    });
  }
}

extension AccountEntityQueryProperty
    on QueryBuilder<AccountEntity, AccountEntity, QQueryProperty> {
  QueryBuilder<AccountEntity, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'row_id');
    });
  }

  QueryBuilder<AccountEntity, String, QQueryOperations> accountIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'account_id');
    });
  }

  QueryBuilder<AccountEntity, int, QQueryOperations> accountIndexProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'account_index');
    });
  }

  QueryBuilder<AccountEntity, String, QQueryOperations> accountNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'account_name');
    });
  }

  QueryBuilder<AccountEntity, String, QQueryOperations> masterIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'master_id');
    });
  }
}

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetSignedRequestCollection on Isar {
  IsarCollection<SignedRequest> get signedRequests => this.collection();
}

const SignedRequestSchema = CollectionSchema(
  name: r'request',
  id: 5499564972368313413,
  properties: {
    r'expires_at': PropertySchema(
      id: 0,
      name: r'expires_at',
      type: IsarType.long,
    ),
    r'request_id': PropertySchema(
      id: 1,
      name: r'request_id',
      type: IsarType.string,
    )
  },
  estimateSize: _signedRequestEstimateSize,
  serialize: _signedRequestSerialize,
  deserialize: _signedRequestDeserialize,
  deserializeProp: _signedRequestDeserializeProp,
  idName: r'row_id',
  indexes: {
    r'request_id': IndexSchema(
      id: -3754367934024666010,
      name: r'request_id',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'request_id',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _signedRequestGetId,
  getLinks: _signedRequestGetLinks,
  attach: _signedRequestAttach,
  version: '3.3.2',
);

int _signedRequestEstimateSize(
  SignedRequest object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.requestId.length * 3;
  return bytesCount;
}

void _signedRequestSerialize(
  SignedRequest object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeLong(offsets[0], object.expiresAt);
  writer.writeString(offsets[1], object.requestId);
}

SignedRequest _signedRequestDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = SignedRequest();
  object.expiresAt = reader.readLong(offsets[0]);
  object.requestId = reader.readString(offsets[1]);
  object.id = id;
  return object;
}

P _signedRequestDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readLong(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _signedRequestGetId(SignedRequest object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _signedRequestGetLinks(SignedRequest object) {
  return [];
}

void _signedRequestAttach(
    IsarCollection<dynamic> col, Id id, SignedRequest object) {
  object.id = id;
}

extension SignedRequestByIndex on IsarCollection<SignedRequest> {
  Future<SignedRequest?> getByRequestId(String requestId) {
    return getByIndex(r'request_id', [requestId]);
  }

  SignedRequest? getByRequestIdSync(String requestId) {
    return getByIndexSync(r'request_id', [requestId]);
  }

  Future<bool> deleteByRequestId(String requestId) {
    return deleteByIndex(r'request_id', [requestId]);
  }

  bool deleteByRequestIdSync(String requestId) {
    return deleteByIndexSync(r'request_id', [requestId]);
  }

  Future<List<SignedRequest?>> getAllByRequestId(List<String> requestIdValues) {
    final values = requestIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'request_id', values);
  }

  List<SignedRequest?> getAllByRequestIdSync(List<String> requestIdValues) {
    final values = requestIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'request_id', values);
  }

  Future<int> deleteAllByRequestId(List<String> requestIdValues) {
    final values = requestIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'request_id', values);
  }

  int deleteAllByRequestIdSync(List<String> requestIdValues) {
    final values = requestIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'request_id', values);
  }

  Future<Id> putByRequestId(SignedRequest object) {
    return putByIndex(r'request_id', object);
  }

  Id putByRequestIdSync(SignedRequest object, {bool saveLinks = true}) {
    return putByIndexSync(r'request_id', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByRequestId(List<SignedRequest> objects) {
    return putAllByIndex(r'request_id', objects);
  }

  List<Id> putAllByRequestIdSync(List<SignedRequest> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'request_id', objects, saveLinks: saveLinks);
  }
}

extension SignedRequestQueryWhereSort
    on QueryBuilder<SignedRequest, SignedRequest, QWhere> {
  QueryBuilder<SignedRequest, SignedRequest, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension SignedRequestQueryWhere
    on QueryBuilder<SignedRequest, SignedRequest, QWhereClause> {
  QueryBuilder<SignedRequest, SignedRequest, QAfterWhereClause> idEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterWhereClause> idNotEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterWhereClause> idGreaterThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterWhereClause> idLessThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterWhereClause>
      requestIdEqualTo(String requestId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'request_id',
        value: [requestId],
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterWhereClause>
      requestIdNotEqualTo(String requestId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'request_id',
              lower: [],
              upper: [requestId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'request_id',
              lower: [requestId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'request_id',
              lower: [requestId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'request_id',
              lower: [],
              upper: [requestId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension SignedRequestQueryFilter
    on QueryBuilder<SignedRequest, SignedRequest, QFilterCondition> {
  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      expiresAtEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'expires_at',
        value: value,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      expiresAtGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'expires_at',
        value: value,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      expiresAtLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'expires_at',
        value: value,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      expiresAtBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'expires_at',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'request_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'request_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'request_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'request_id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'request_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'request_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'request_id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'request_id',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'request_id',
        value: '',
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      requestIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'request_id',
        value: '',
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition>
      idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'row_id',
        value: value,
      ));
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'row_id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension SignedRequestQueryObject
    on QueryBuilder<SignedRequest, SignedRequest, QFilterCondition> {}

extension SignedRequestQueryLinks
    on QueryBuilder<SignedRequest, SignedRequest, QFilterCondition> {}

extension SignedRequestQuerySortBy
    on QueryBuilder<SignedRequest, SignedRequest, QSortBy> {
  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy> sortByExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expires_at', Sort.asc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy>
      sortByExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expires_at', Sort.desc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy> sortByRequestId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'request_id', Sort.asc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy>
      sortByRequestIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'request_id', Sort.desc);
    });
  }
}

extension SignedRequestQuerySortThenBy
    on QueryBuilder<SignedRequest, SignedRequest, QSortThenBy> {
  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy> thenByExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expires_at', Sort.asc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy>
      thenByExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expires_at', Sort.desc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy> thenByRequestId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'request_id', Sort.asc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy>
      thenByRequestIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'request_id', Sort.desc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'row_id', Sort.asc);
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'row_id', Sort.desc);
    });
  }
}

extension SignedRequestQueryWhereDistinct
    on QueryBuilder<SignedRequest, SignedRequest, QDistinct> {
  QueryBuilder<SignedRequest, SignedRequest, QDistinct> distinctByExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'expires_at');
    });
  }

  QueryBuilder<SignedRequest, SignedRequest, QDistinct> distinctByRequestId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'request_id', caseSensitive: caseSensitive);
    });
  }
}

extension SignedRequestQueryProperty
    on QueryBuilder<SignedRequest, SignedRequest, QQueryProperty> {
  QueryBuilder<SignedRequest, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'row_id');
    });
  }

  QueryBuilder<SignedRequest, int, QQueryOperations> expiresAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'expires_at');
    });
  }

  QueryBuilder<SignedRequest, String, QQueryOperations> requestIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'request_id');
    });
  }
}

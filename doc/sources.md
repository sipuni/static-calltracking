# Настройка правил определения трафика
В настройках вызова скрипта подмены в поле sources задаются правила определения источников трафика. 
```javascript
    ...
    sources: {
        'ydirect':{'utm_source': 'direct.yandex.ru'},
        'articles':{'ref':/(habrahabr|oborot\.ru)/ig},
        'facebook':{'ref': function(subject) { return subject.match(/facebook/ig); }},
        'openstat':{'dst': /_openstat/ig },
      },
    ...  
```      
Ключ ydirect, articles и другие это название источника трафика. Это название потом используется в списке телефонов.

В описании правила может использоваться одно из нескольких полей: 
  * ref - реферер, url с которого посетитель перешел на ваш сайт;
  * dst - адрес страницы, на которую пришел посетитель;
  * utm_ - параметр начинающийся с utm_, проверка будет происходить только в этом параметре.

#### Пример с utm метками
Например, если страница, нашего сайта, на которую перешел пользователь http://oursite.ru/landing.html?utm_campaign=mailchimp_2 мы можем задать правило:
```javascript
'email': {'utm_campaign': 'mailchimp'}
```
mailchimp задан как строка, значит будет происходить проверка на вхождение mailchimp в значение параметра utm_campaign

Правило можно задать при помощи регулярного выражения:
```javascript
'email': {'utm_campaign': /mailchimp/ig}
```

Также правило можно задать в виде функции:
```javascript
'email': {'utm_campaign': function(subject){ return subject.indefOf('mailchimp')>-1 };}
```

Конечно, варианты с регулярным выражением и функцией в данной ситуации избыточные, они приведены для примера.

#### Пример со страницей источником
Предположим, пользователь перешел на сайт со страницы http://habrahabr.ru/company/sipuni/blog/270327/
Для определения трафика только с этой страницы можно создать правило по названием habr_article
```javascript
 'habr_article': {'ref': 'blog/270327'}
```
ref - означает выполнять проверку поля реферер, искать в нем подстроку 'blog/270327'

### Правила определения трафика по умолчанию
Для удобства по умолчанию заданы несколько правил определения трафика, которые можно использовать в конфигурации номеров телефонов. Вот список этих правил:
```javascript
    sources: {
        'organic':{'ref':/:\/\/(?:www\.)?(google|yandex|mail\.ru|search\.tut\.by|rambler|bing|yahoo)(?:\.(\w+))?/ig},
        'social':{'ref':/:\/\/[^\/]*(twitter|t\.co|facebook|linkedin|vk\.com|odnoklassniki)/ig},
        'email':{'utm_source':'email'},
        'adwords':{'dst': 'gclid='},
        'ydirect_utm':{'utm_source':'direct.yandex.ru'},
        'ydirect_openstat':{'dst': function(subject){
                                      var o = query.getRawParam(subject, '_openstat');
                                      return (o && a2b(o).indexOf('direct.yandex.ru')>-1);
                                    }}
        },
```

 * [Оглавление](index.md)
 * [Установка и настройка](install.md)
 * [Отображение нескольких телефонов](many-numbers.md)
 * [Подмена контента страницы](subst-content.md)
 * [Шаблоны отображени номера](patterns.md)


[![](img/sipuni_logo.png)](http://calltracking.sipuni.com)
